from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from cryptography.fernet import Fernet

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class UserIdentity(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='identity')
    aadhaar_number = models.CharField(max_length=255) # Stored encrypted
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Identity for {self.user.email}"

    def set_aadhaar(self, number):
        f = Fernet(settings.FERNET_KEY.encode())
        self.aadhaar_number = f.encrypt(number.encode()).decode()

    def get_aadhaar(self):
        f = Fernet(settings.FERNET_KEY.encode())
        return f.decrypt(self.aadhaar_number.encode()).decode()

class Room(models.Model):
    HOUSEKEEPING_STATUS = [
        ('ready', 'Ready / Clean'),
        ('dirty', 'Dirty / Pending'),
        ('maintenance', 'Under Maintenance'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField()
    total_inventory = models.PositiveIntegerField(default=1, help_text="Number of identical rooms available for this type")
    extra_bed_price = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00, help_text="Additional price if guests exceed capacity")
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    housekeeping_status = models.CharField(max_length=20, choices=HOUSEKEEPING_STATUS, default='ready')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ServiceRequest(models.Model):
    REQUEST_TYPES = [
        ('housekeeping', 'Extra Housekeeping'),
        ('supplies', 'Extra Supplies (Towels, Water)'),
        ('maintenance', 'Maintenance Issue'),
        ('concierge', 'Concierge Assistance'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    booking = models.ForeignKey('Booking', on_delete=models.CASCADE, related_name='service_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    staff_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_request_type_display()} - Booking #{self.booking.id}"

class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.URLField(max_length=500)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.room.name}"

class Amenity(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=100, help_text="CSS class or icon name")

    def __str__(self):
        return self.name

class RoomAmenity(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_amenities')
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('room', 'amenity')

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    total_days = models.IntegerField()
    guests = models.IntegerField()
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    has_extra_bed = models.BooleanField(default=False)
    experiences = models.ManyToManyField('Experience', blank=True, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} by {self.user.email}"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    
    # Razorpay Specific Tracking
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Booking {self.booking.id}"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.email} for {self.room.name}"

class GlobalSetting(models.Model):
    resort_name = models.CharField(max_length=200, default="Coorg Pristine Woods Hotel")
    contact_email = models.EmailField(default="reservations@Pristine Woodspalace.com")
    base_currency = models.CharField(max_length=10, default="INR")
    notifications_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Global Settings"

    class Meta:
        verbose_name = "Global Setting"
        verbose_name_plural = "Global Settings"

class Experience(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.CharField(max_length=50, help_text="e.g. 2 hours")
    image_url = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ServiceRequest(models.Model):
    SERVICE_TYPES = [
        ('housekeeping', 'Housekeeping'),
        ('supplies', 'Supplies'),
        ('concierge', 'Concierge'),
        ('maintenance', 'Maintenance'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('resolved', 'Resolved'),
        ('cancelled', 'Cancelled'),
    ]
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='service_requests', null=True, blank=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_service_requests')
    request_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    experience = models.ForeignKey(Experience, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    otp = models.CharField(max_length=6, blank=True)
    guest_email = models.EmailField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_request_type_display()} for {self.room.name} - {self.status}"
