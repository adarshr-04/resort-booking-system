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
from datetime import date

from .models import UserIdentity, Room, RoomImage, Amenity, Booking, Payment, Review, GlobalSetting, ServiceRequest, Experience
from .serializers import (
    UserSerializer, UserIdentitySerializer, RoomSerializer,
    RoomImageSerializer, AmenitySerializer, BookingSerializer,
    PaymentSerializer, ReviewSerializer, GlobalSettingSerializer,
    ServiceRequestSerializer, ExperienceSerializer
)
from .razorpay_service import RazorpayService

User = get_user_model()

# ─────────────────────────────────────────────
# PART 1: Unified Login (OTP for ALL Users)
# ─────────────────────────────────────────────

class ResortEmailService:
    @staticmethod
    def send_branded_email(subject, template_name, context, recipient_list):
        try:
            # Add global context variables
            context['frontend_url'] = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            
            html_message = render_to_string(template_name, context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
            return False

class LoginRequestView(APIView):
    """
    Step 1: Universal Login.
    Sends OTP to email for both Guests and Admins.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        user = authenticate(email=email, password=password)

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
        role_label = "Guest"
        success = ResortEmailService.send_branded_email(
            subject=f"🔐 Your {role_label} Login Code — Coorg Pristine Woods",
            template_name='bookings/emails/otp_email.html',
            context={'otp': otp, 'timeout_minutes': 10, 'role_label': role_label},
            recipient_list=[email]
        )

        if not success:
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
        all_bookings = Booking.objects.filter(
            room=room, 
            status__in=['pending', 'confirmed']
        ).values('check_in', 'check_out')
        
        # If inventory is 1, original logic is fine (more efficient)
        if room.total_inventory <= 1:
            return Response(list(all_bookings))
            
        # For multi-room inventory, we need to find dates where COUNT >= INVENTORY
        from collections import Counter
        from datetime import timedelta
        
        date_counts = Counter()
        for b in all_bookings:
            curr = b['check_in']
            while curr < b['check_out']:
                date_counts[curr] += 1
                curr += timedelta(days=1)
        
        # Find dates that are fully booked
        sold_out_dates = [d for d, count in date_counts.items() if count >= room.total_inventory]
        sold_out_dates.sort()
        
        # Group consecutive dates into ranges for the frontend calendar
        ranges = []
        if sold_out_dates:
            start = sold_out_dates[0]
            for i in range(1, len(sold_out_dates)):
                if sold_out_dates[i] != sold_out_dates[i-1] + timedelta(days=1):
                    ranges.append({'check_in': start.isoformat(), 'check_out': (sold_out_dates[i-1] + timedelta(days=1)).isoformat()})
                    start = sold_out_dates[i]
            ranges.append({'check_in': start.isoformat(), 'check_out': (sold_out_dates[-1] + timedelta(days=1)).isoformat()})
            
        return Response(ranges)


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

    @action(detail=True, methods=['POST'])
    def initialize_payment(self, request, pk=None):
        booking = self.get_object()
        rzp = RazorpayService()
        
        # Create Razorpay Order
        receipt = f"Receipt_Booking_{booking.id}"
        order = rzp.create_order(amount=float(booking.total_price), receipt=receipt)
        
        if not order:
            return Response({'error': 'Failed to create Razorpay order'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create or update Payment record
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'amount': booking.total_price,
                'payment_method': 'Razorpay',
                'payment_status': 'pending'
            }
        )
        payment.razorpay_order_id = order['id']
        payment.save()
        
        return Response({
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'key_id': settings.RAZORPAY_KEY_ID
        })

    @action(detail=True, methods=['POST'])
    def verify_payment(self, request, pk=None):
        booking = self.get_object()
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        rzp = RazorpayService()
        is_valid = rzp.verify_payment_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature
        )
        
        if is_valid:
            # Update Payment
            try:
                payment = booking.payment
                payment.razorpay_payment_id = razorpay_payment_id
                payment.razorpay_signature = razorpay_signature
                payment.payment_status = 'success'
                payment.save()
                
                # Update Booking
                booking.status = 'confirmed'
                booking.save()
                
                # Send confirmation email
                self._send_guest_confirmed_email(booking)
                
                return Response({'status': 'Payment verified and booking confirmed'})
            except Payment.DoesNotExist:
                return Response({'error': 'Payment record not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Invalid payment signature'}, status=status.HTTP_400_BAD_REQUEST)

    def _send_guest_pending_email(self, booking):
        ResortEmailService.send_branded_email(
            subject="🛎️ Booking Request Received — Coorg Pristine Woods",
            template_name='bookings/emails/booking_guest_template.html',
            context={
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'pending'
            },
            recipient_list=[booking.user.email]
        )

    def _send_admin_action_email(self, booking):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        # Create a seamless login token for the admin recipient
        User = get_user_model()
        admin_user = User.objects.filter(is_staff=True).first()
        login_token = signing.dumps({'user_id': admin_user.id if admin_user else None}, salt='admin-login')
        
        # SINGLE LINK: Points to dashboard with login token
        dashboard_url = f"{frontend_url}/admin/bookings?login_token={login_token}"

        ResortEmailService.send_branded_email(
            subject=f"🏨 New Booking Request — Action Required",
            template_name='bookings/emails/admin_notification_template.html',
            context={
                'guest_name': booking.user.email,
                'guest_email': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'total_price': f"INR {booking.total_price}",
                'dashboard_url': dashboard_url
            },
            recipient_list=[settings.DEFAULT_FROM_EMAIL]
        )

    def _send_guest_confirmed_email(self, booking):
        ResortEmailService.send_branded_email(
            subject="✅ Booking Confirmed — Coorg Pristine Woods",
            template_name='bookings/emails/booking_guest_template.html',
            context={
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'confirmed'
            },
            recipient_list=[booking.user.email]
        )

    def _send_guest_rejected_email(self, booking, reason):
        ResortEmailService.send_branded_email(
            subject="🛎️ Booking Update — Coorg Pristine Woods",
            template_name='bookings/emails/booking_guest_template.html',
            context={
                'guest_name': booking.user.email,
                'room_name': booking.room.name,
                'check_in': booking.check_in,
                'check_out': booking.check_out,
                'booking_id': booking.id,
                'status': 'cancelled',
                'reason': reason
            },
            recipient_list=[booking.user.email]
        )

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        room_id = self.request.query_params.get('room')
        if room_id:
            qs = qs.filter(room_id=room_id)
        return qs

    def perform_create(self, serializer):
        room = serializer.validated_data.get('room')
        # One review per room per user
        if Review.objects.filter(user=self.request.user, room=room).exists():
            raise serializers.ValidationError("You have already reviewed this room.")
        serializer.save(user=self.request.user)


class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all()
    serializer_class = GlobalSettingSerializer
    permission_classes = [IsAdminUser]


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"DEBUG: ServiceRequest validation failed: {serializer.errors}")
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        if self.request.user.is_staff:
            return ServiceRequest.objects.all()
        return ServiceRequest.objects.filter(booking__user=self.request.user)

    def perform_create(self, serializer):
        data = self.request.data
        booking_id = data.get('booking')
        room_id = data.get('room') or data.get('room_id')
        
        # If room_id is missing but booking_id is present, get room from booking
        if not room_id and booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                room_id = booking.room_id
            except Booking.DoesNotExist:
                pass

        is_verified = self.request.user.is_authenticated
        guest_email = self.request.user.email if self.request.user.is_authenticated else data.get('guest_email')
        
        # Final safety check: if room_id is still missing, we can't save
        if not room_id:
            raise serializers.ValidationError({"room": "Room information is required."})

        # Ensure room_id is passed to save()
        instance = serializer.save(
            room_id=room_id,
            booking_id=booking_id,
            is_verified=is_verified,
            guest_email=guest_email
        )

        # NEW: Send Notification Email to Guest
        if guest_email:
            ResortEmailService.send_branded_email(
                subject=f"🛎️ Request Received: {instance.get_request_type_display()} — Coorg Pristine Woods",
                template_name='bookings/emails/service_request_guest.html',
                context={
                    'request_type': instance.get_request_type_display(),
                    'description': instance.description,
                    'room_name': instance.room.name if instance.room else "Your Room"
                },
                recipient_list=[guest_email]
            )

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        new_status = instance.status

        # If status changed to 'resolved', send email
        if old_status != 'resolved' and new_status == 'resolved':
            guest_email = instance.guest_email or (instance.booking.user.email if instance.booking else None)
            if guest_email:
                ResortEmailService.send_branded_email(
                    subject=f"✅ Service Completed: {instance.get_request_type_display()} — Coorg Pristine Woods",
                    template_name='bookings/emails/service_request_resolved.html',
                    context={
                        'request_type': instance.get_request_type_display(),
                        'description': instance.description,
                    },
                    recipient_list=[guest_email]
                )

class StaffOpsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def daily_overview(self, request):
        today = date.today()
        
        arrivals = Booking.objects.filter(check_in=today, status='confirmed')
        departures = Booking.objects.filter(check_out=today, status='confirmed')
        
        # Room inventory summary
        rooms = Room.objects.all()
        rooms_data = RoomSerializer(rooms, many=True).data
        
        # Pending service requests
        requests = ServiceRequest.objects.filter(status='pending')
        
        return Response({
            'arrivals_today': BookingSerializer(arrivals, many=True).data,
            'departures_today': BookingSerializer(departures, many=True).data,
            'room_statuses': rooms_data,
            'active_requests': ServiceRequestSerializer(requests, many=True).data
        })

    @action(detail=False, methods=['get'])
    def guest_profile(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email parameter is required'}, status=400)
            
        # Get all data for this guest
        bookings = Booking.objects.filter(user__email=email).order_by('-check_in')
        # Service requests might be linked by booking or by email (for portal requests)
        requests = ServiceRequest.objects.filter(
            models.Q(booking__user__email=email) | models.Q(guest_email=email)
        ).order_by('-created_at')
        reviews = Review.objects.filter(user__email=email).order_by('-created_at')
        
        # Calculate some stats
        total_spent = sum(b.total_price for b in bookings if b.status in ['confirmed', 'completed'])
        total_nights = sum(b.total_days for b in bookings if b.status in ['confirmed', 'completed'])
        
        return Response({
            'profile': {
                'email': email,
                'total_spent': total_spent,
                'total_stays': bookings.filter(status='completed').count(),
                'total_nights': total_nights,
                'loyalty_level': 'Platinum' if total_spent > 50000 else 'Gold' if total_spent > 20000 else 'Silver'
            },
            'bookings': BookingSerializer(bookings, many=True).data,
            'requests': ServiceRequestSerializer(requests, many=True).data,
            'reviews': ReviewSerializer(reviews, many=True).data
        })

    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        # Calculate monthly revenue for the current year
        from django.db.models import Sum
        from django.db.models.functions import ExtractMonth
        import datetime
        
        current_year = datetime.datetime.now().year
        monthly_revenue = Booking.objects.filter(
            status='confirmed',
            created_at__year=current_year
        ).annotate(
            month=ExtractMonth('created_at')
        ).values('month').annotate(
            total=Sum('total_price')
        ).order_by('month')
        
        # Format for frontend chart
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        formatted_data = []
        
        # Create a dict for easy lookup
        revenue_map = {item['month']: float(item['total']) for item in monthly_revenue}
        
        # Fill all 12 months (even with 0)
        for i in range(1, 13):
            formatted_data.append({
                'label': month_names[i-1],
                'value': revenue_map.get(i, 0)
            })
            
        return Response(formatted_data)

    @action(detail=True, methods=['post'])
    def update_room_status(self, request, pk=None):
        room = Room.objects.get(pk=pk)
        new_status = request.data.get('status')
        if new_status in [s[0] for s in Room.HOUSEKEEPING_STATUS]:
            room.housekeeping_status = new_status
            room.save()
            return Response({'status': 'OK'})
        return Response({'error': 'Invalid status'}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class ChatbotViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def chat(self, request):
        user_message = request.data.get('message')
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        try:
            if not api_key or not api_key.startswith('AIza'):
                # Automated Failover to Resort Expert Mode
                return self.get_fallback_response(user_message)
                
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(f"You are a helpful luxury resort concierge at Coorg Pristine Woods. Use a professional, welcoming tone. Guest says: {user_message}")
            return Response({'reply': response.text})
        except Exception as e:
            print(f"Chatbot API Error: {str(e)}")
            return self.get_fallback_response(user_message)

    def get_fallback_response(self, message):
        msg = message.lower()
        if 'about' in msg or 'resort' in msg:
            reply = "Coorg Pristine Woods is a luxury sanctuary nestled in the heart of Coorg, offering unparalleled comfort and breathtaking views. We feature premium suites, an infinity pool, and guided nature experiences."
        elif 'dining' in msg or 'eat' in msg:
            reply = "Our signature restaurant offers a fusion of local Kodava flavors and international cuisine. We also offer private deck dining for a romantic experience."
        elif 'activity' in msg or 'activities' in msg:
            reply = "We offer coffee plantation tours, bird watching, riverside meditation, and traditional Ayurvedic spa treatments."
        elif 'stay' in msg:
            reply = "I can help with information about your current stay. Please let me know if you need housekeeping, room upgrades, or concierge services."
        else:
            reply = "Welcome to Coorg Pristine Woods! I am here to assist you with dining, activities, or any special requests you might have. How can I make your stay memorable?"
        return Response({'reply': reply})


class ExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Experience.objects.filter(is_active=True)
    serializer_class = ExperienceSerializer
    permission_classes = [AllowAny]
