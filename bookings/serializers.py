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

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'

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
    housekeeping_status_display = serializers.CharField(source='get_housekeeping_status_display', read_only=True)

    class Meta:
        model = Room
        fields = ('id', 'name', 'description', 'price_per_day', 'price_per_night', 'capacity', 'total_inventory', 'extra_bed_price', 'is_available', 'housekeeping_status', 'housekeeping_status_display', 'images', 'amenities')

    def get_amenities(self, obj):
        amenities = Amenity.objects.filter(roomamenity__room=obj)
        return AmenitySerializer(amenities, many=True).data

class BookingSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_phone = serializers.ReadOnlyField(source='user.phone')
    user_name = serializers.SerializerMethodField()
    room_name = serializers.ReadOnlyField(source='room.name')
    experience_ids = serializers.PrimaryKeyRelatedField(
        queryset=Experience.objects.filter(is_active=True),
        many=True, write_only=True, required=False, source='experiences'
    )

    experience_details = ExperienceSerializer(many=True, read_only=True, source='experiences')

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'total_days', 'total_price', 'price_per_day', 'price_per_night', 'user_email', 'user_phone', 'user_name', 'room_name', 'experience_details')

    def get_user_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.email

    def validate(self, data):
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        room = data.get('room')
        guests = data.get('guests', 1)
        
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError("Check-out must be after check-in")

            # Inventory Check: How many rooms of this type are already booked for these dates?
            overlapping_count = Booking.objects.filter(
                room=room,
                check_in__lt=check_out,
                check_out__gt=check_in,
                status__in=['pending', 'confirmed']
            )
            
            if self.instance and self.instance.pk:
                overlapping_count = overlapping_count.exclude(pk=self.instance.pk)
                
            if overlapping_count.count() >= room.total_inventory:
                raise serializers.ValidationError(
                    f"All units of {room.name} are already reserved for these dates. "
                    "Please choose different dates or another accommodation."
                )

            delta = check_out - check_in
            total_days = delta.days
            data['total_days'] = total_days
            
            data['price_per_day'] = room.price_per_day
            data['price_per_night'] = room.price_per_night
            
            # Base Room Price
            base_price = total_days * room.price_per_night
            
            # Guest Capacity & Extra Bed Logic
            extra_bed_cost = 0
            if guests > room.capacity:
                data['has_extra_bed'] = True
                extra_bed_cost = room.extra_bed_price * total_days
            else:
                data['has_extra_bed'] = False

            # Add-on pricing (Experiences)
            experiences = data.get('experiences', [])
            addon_price = sum(exp.price for exp in experiences)
            
            data['total_price'] = base_price + extra_bed_cost + addon_price

        return data

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)
    room_name = serializers.ReadOnlyField(source='room.name')

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'room', 'room_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_user_name(self, obj):
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full if full else obj.user.email.split('@')[0].capitalize()

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'

class ServiceRequestSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    guest_name = serializers.SerializerMethodField(read_only=True)
    room_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceRequest
        fields = '__all__'
        extra_kwargs = {
            'room': {'required': False},
            'booking': {'required': False}
        }

    def get_guest_name(self, obj):
        if obj.booking and obj.booking.user:
            return obj.booking.user.email
        return obj.guest_email or "Guest"

    def get_room_name(self, obj):
        if obj.room:
            return obj.room.name
        if obj.booking and obj.booking.room:
            return obj.booking.room.name
        return "Unknown Room"

