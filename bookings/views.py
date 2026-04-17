from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.cache import cache
from django.core import signing
from django.http import HttpResponseRedirect
from django.views import View
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import random
import string
import google.generativeai as genai

from .models import UserIdentity, Room, RoomImage, Amenity, Booking, Payment, Review, GlobalSetting, ServiceRequest, Experience
from .serializers import (
    UserSerializer, UserIdentitySerializer, RoomSerializer,
    RoomImageSerializer, AmenitySerializer, BookingSerializer,
    PaymentSerializer, ReviewSerializer, GlobalSettingSerializer,
    ServiceRequestSerializer, ExperienceSerializer
)

User = get_user_model()

# ─────────────────────────────────────────────
# PART 1: Unified Login (OTP for ALL Users)
# ─────────────────────────────────────────────

class LoginRequestView(APIView):
    """
    Step 1: Universal Login Request.
    Authenticates email/password. If valid, sends OTP to email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Invalid credentials. Please check your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # NEW: Bypass OTP for Admins (Staff)
        if user.is_staff:
            refresh = RefreshToken.for_user(user)
            return Response({
                'otp_required': False,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        # Generate 6-digit OTP and cache it for 10 minutes
        otp = ''.join(random.choices(string.digits, k=6))
        cache.set(f'login_otp_{email}', otp, timeout=600)

        # Send OTP email
        try:
            role_label = "Guest" # Only guests get here now
            context = {
                'otp': otp,
                'timeout_minutes': 10,
                'role_label': role_label,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/otp_email.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=f"🔐 Your {role_label} Login Code — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"[LOGIN OTP EMAIL ERROR] {e}")
            return Response({'error': 'Could not send OTP email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'otp_required': True, 'email': email, 'message': 'OTP sent to your email.'})


class LoginVerifyView(APIView):
    """
    Step 2: Universal Login Verification.
    Validates OTP and returns JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_input = request.data.get('otp', '').strip()

        cached_otp = cache.get(f'login_otp_{email}')

        if not cached_otp:
            return Response({'error': 'OTP has expired. Please log in again.'}, status=status.HTTP_400_BAD_REQUEST)

        if cached_otp != otp_input:
            return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        # OTP valid – clear cache
        cache.delete(f'login_otp_{email}')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class TokenLoginView(APIView):
    """
    Seamless Login via Signed Token.
    Verifies a 'login-token' and returns full JWT credentials.
    Used for 'One-Click' access from admin emails.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token required'}, status=400)

        try:
            data = signing.loads(token, salt='admin-login', max_age=86400) # 24h
            user_id = data.get('user_id')
            user = User.objects.get(id=user_id)
            
            if not user.is_staff:
                return Response({'error': 'Unauthorized'}, status=403)

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        except Exception:
            return Response({'error': 'Invalid or expired login link'}, status=400)


# ─────────────────────────────────────────────
# PART 2: Verified Registration (OTP before account creation)
# ─────────────────────────────────────────────

class RegisterRequestView(APIView):
    """
    Step 1: Registration Request.
    Validates user data and sends OTP. Does NOT create user yet.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        
        # Validate that user doesn't exist
        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use serializer to validate data but don't save yet
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # Cache registration data + OTP for 15 minutes
        reg_data = {
            'otp': otp,
            'user_data': request.data
        }
        cache.set(f'reg_request_{email}', reg_data, timeout=900)

        # Send OTP email
        try:
            context = {
                'otp': otp,
                'timeout_minutes': 15,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/otp_email.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="✨ Welcome to Coorg Pristine Woods — Verify Your Account",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"[REG OTP EMAIL ERROR] {e}")
            return Response({'error': 'Could not send verification email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification code sent to your email.'})


class RegisterVerifyView(APIView):
    """
    Step 2: Registration Verification.
    Creates the user account after OTP is verified.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_input = request.data.get('otp', '').strip()

        cached_data = cache.get(f'reg_request_{email}')

        if not cached_data:
            return Response({'error': 'Verification session expired. Please register again.'}, status=status.HTTP_400_BAD_REQUEST)

        if cached_data['otp'] != otp_input:
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        # OTP valid – Create user
        user_data = cached_data['user_data']
        serializer = UserSerializer(data=user_data)
        if serializer.is_valid():
            user = serializer.save()
            cache.delete(f'reg_request_{email}')
            
            # Return JWT tokens for immediate login
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# (Existing views continue below...)
# ─────────────────────────────────────────────

class BookingActionView(APIView):
    """
    Handles 'Confirm' and 'Reject' actions from signed email links.
    Bypasses standard authentication as the signed token provides security.
    """
    permission_classes = [AllowAny]
    FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    def get(self, request):
        token = request.GET.get('token', '')
        rejection_reason = request.GET.get('reason', 'The requested dates are unfortunately no longer available.')

        try:
            data = signing.loads(token, salt='booking-action', max_age=172800)  # 48h
        except signing.SignatureExpired:
            return Response({'error': 'Link expired'}, status=400)
        except signing.BadSignature:
            return Response({'error': 'Invalid link signature'}, status=400)

        booking_id = data.get('booking_id')
        action = data.get('action')

        try:
            booking = Booking.objects.select_related('room', 'user').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        if booking.status not in ['pending']:
            return Response({'error': 'Booking already processed'}, status=400)

        if action == 'confirm':
            booking.status = 'confirmed'
            booking.save()
            self._send_guest_confirmed_email(booking)
            return Response({'status': 'success', 'message': f'Booking for {booking.room.name} confirmed.', 'room': booking.room.name})

        elif action == 'reject':
            booking.status = 'cancelled'
            booking.save()
            self._send_guest_rejected_email(booking, rejection_reason)
            return Response({'status': 'success', 'message': 'Booking rejected.'})

        return Response({'error': 'Invalid action'}, status=400)

    def _send_guest_confirmed_email(self, booking):
        try:
            context = {
                'guest_name': booking.user.email, # Use email if name not available
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'confirmed',
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/booking_guest_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="✅ Booking Confirmed — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

    def _send_guest_rejected_email(self, booking, reason):
        try:
            context = {
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'cancelled',
                'reason': reason,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/booking_guest_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="Booking Update — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # We disable direct 'create' via this ViewSet to force our new OTP RegisterRequest flow
        if self.action == 'create':
            return [permissions.DenyAll()]
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=['GET'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class UserIdentityViewSet(viewsets.ModelViewSet):
    queryset = UserIdentity.objects.all()
    serializer_class = UserIdentitySerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        identity = self.get_object()
        identity.is_verified = True
        identity.save()
        return Response({'status': 'Identity verified successfully'})


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        room = self.get_object()
        bookings = Booking.objects.filter(
            room=room, 
            status__in=['pending', 'confirmed']
        ).values('check_in', 'check_out')
        return Response(list(bookings))


class RoomImageViewSet(viewsets.ModelViewSet):
    queryset = RoomImage.objects.all()
    serializer_class = RoomImageSerializer


class AmenityViewSet(viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        self._send_guest_pending_email(booking)
        self._send_admin_action_email(booking)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        booking = serializer.save()
        new_status = booking.status

        if old_status != new_status:
            if new_status == 'confirmed':
                self._send_guest_confirmed_email(booking)
            elif new_status == 'cancelled':
                self._send_guest_rejected_email(booking, "Cancelled by Admin.")

    def _send_guest_pending_email(self, booking):
        try:
            context = {
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'pending',
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/booking_guest_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="Booking Request Received — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

    def _send_admin_action_email(self, booking):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        # Create a seamless login token for the admin recipient
        admin_user = User.objects.filter(is_staff=True).first()
        login_token = signing.dumps({'user_id': admin_user.id if admin_user else None}, salt='admin-login')
        
        # SINGLE LINK: Points to dashboard with login token
        dashboard_url = f"{frontend_url}/admin/bookings?login_token={login_token}"

        try:
            context = {
                'guest_name': booking.user.email,
                'guest_email': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'total_price': f"INR {booking.total_price}",
                'dashboard_url': dashboard_url,
                'frontend_url': frontend_url
            }
            
            html_message = render_to_string('bookings/emails/admin_notification_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=f"🏨 New Booking Request — Action Required",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[getattr(settings, 'ADMIN_EMAIL', settings.EMAIL_HOST_USER)],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

    def _send_guest_confirmed_email(self, booking):
        try:
            context = {
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'confirmed',
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/booking_guest_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="✅ Booking Confirmed — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

    def _send_guest_rejected_email(self, booking, reason):
        try:
            context = {
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'cancelled',
                'reason': reason,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/booking_guest_template.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="Booking Update — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer


class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all()
    serializer_class = GlobalSettingSerializer
    permission_classes = [IsAdminUser]


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        otp = ''.join(random.choices(string.digits, k=6))
        instance = serializer.save(otp=otp)
        
        try:
            context = {
                'otp': otp,
                'timeout_minutes': 15,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            }
            html_message = render_to_string('bookings/emails/otp_email.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject="🛎️ Service Request Verification — Coorg Pristine Woods",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.guest_email],
                html_message=html_message,
                fail_silently=True,
            )
        except: pass

    @action(detail=True, methods=['post'])
    def verify_otp(self, request, pk=None):
        instance = self.get_object()
        if instance.otp == request.data.get('otp'):
            instance.is_verified = True
            instance.save()
            return Response({'status': 'OK'})
        return Response({'error': 'Invalid'}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ChatbotViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def chat(self, request):
        user_message = request.data.get('message')
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-flash-latest')
            response = model.generate_content(f"Be a resort concierge. Guest says: {user_message}")
            return Response({'reply': response.text})
        except: return Response({'reply': 'Error'}, status=500)


class ExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Experience.objects.filter(is_active=True)
    serializer_class = ExperienceSerializer
    permission_classes = [AllowAny]
