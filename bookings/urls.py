from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserIdentityViewSet, RoomViewSet,
    RoomImageViewSet, AmenityViewSet, BookingViewSet,
    PaymentViewSet, ReviewViewSet, GlobalSettingViewSet,
    ServiceRequestViewSet, ChatbotViewSet, ExperienceViewSet,
    StaffOpsViewSet, LoginRequestView, LoginVerifyView, RegisterRequestView, 
    RegisterVerifyView, BookingActionView, TokenLoginView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'user-identities', UserIdentityViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'room-images', RoomImageViewSet)
router.register(r'amenities', AmenityViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'settings', GlobalSettingViewSet, basename='settings')
router.register(r'service-requests', ServiceRequestViewSet)
router.register(r'chatbot', ChatbotViewSet, basename='chatbot')
router.register(r'experiences', ExperienceViewSet)
router.register(r'staff-ops', StaffOpsViewSet, basename='staff-ops')

urlpatterns = [
    path('', include(router.urls)),
    
    # Universal Login (OTP for everyone)
    path('auth/login-request/', LoginRequestView.as_view(), name='login-request'),
    path('auth/login-verify/', LoginVerifyView.as_view(), name='login-verify'),
    
    # Verified Registration
    path('auth/register-request/', RegisterRequestView.as_view(), name='register-request'),
    path('auth/register-verify/', RegisterVerifyView.as_view(), name='register-verify'),

    # Admin Seamless Access
    path('auth/token-login/', TokenLoginView.as_view(), name='token-login'),
    path('bookings/action/', BookingActionView.as_view(), name='booking-action'),
]
