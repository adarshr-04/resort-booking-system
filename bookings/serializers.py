from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserIdentity, Room, RoomImage, Amenity, RoomAmenity, Booking, Payment, Review, GlobalSetting, ServiceRequest, Experience
from datetime import date

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'phone', 'address', 'is_staff')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserIdentitySerializer(serializers.ModelSerializer):
    aadhaar_number = serializers.CharField(write_only=True)
    decrypted_aadhaar = serializers.SerializerMethodField()

    class Meta:
        model = UserIdentity
        fields = ('id', 'user', 'aadhaar_number', 'is_verified', 'decrypted_aadhaar', 'created_at')

    def get_decrypted_aadhaar(self, obj):
        try:
            return obj.get_aadhaar()
        except:
            return None

    def create(self, validated_data):
        aadhaar = validated_data.pop('aadhaar_number')
        identity = UserIdentity.objects.create(**validated_data)
        identity.set_aadhaar(aadhaar)
        identity.save()
        return identity

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = '__all__'

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    images = RoomImageSerializer(many=True, read_only=True)
    amenities = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ('id', 'name', 'description', 'price_per_day', 'price_per_night', 'capacity', 'is_available', 'images', 'amenities')

    def get_amenities(self, obj):
        amenities = Amenity.objects.filter(roomamenity__room=obj)
        return AmenitySerializer(amenities, many=True).data

class BookingSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_phone = serializers.ReadOnlyField(source='user.phone')
    user_name = serializers.SerializerMethodField()
    room_name = serializers.ReadOnlyField(source='room.name')

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'total_days', 'total_price', 'price_per_day', 'price_per_night', 'user_email', 'user_phone', 'user_name', 'room_name')

    def get_user_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.email

    def validate(self, data):
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        room = data.get('room')
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError("Check-out must be after check-in")

            # Strict Overlap Check: requested_in < existing_out AND requested_out > existing_in
            overlapping_bookings = Booking.objects.filter(
                room=room,
                check_in__lt=check_out,
                check_out__gt=check_in,
                status__in=['pending', 'confirmed']
            )
            
            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(pk=self.instance.pk)
            
            if overlapping_bookings.exists():
                raise serializers.ValidationError("This room is already reserved for the selected dates. Please choose different dates or another room.")

            delta = check_out - check_in
            data['total_days'] = delta.days
            
            # Use room prices
            data['price_per_day'] = room.price_per_day
            data['price_per_night'] = room.price_per_night
            
            # Simple calculation for total price using the night rate
            data['total_price'] = delta.days * room.price_per_night

        return data

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'

class ServiceRequestSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    
    class Meta:
        model = ServiceRequest
        fields = '__all__'
        read_only_fields = ('otp', 'is_verified')

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'
