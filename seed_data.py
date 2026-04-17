import os
import django
import random
from datetime import date, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import User, Room, Booking, Amenity, RoomAmenity, RoomImage

def seed_data():
    print("Seeding Coorg Pristine Woods data...")

    # 1. Create or get Admin
    admin_user, _ = User.objects.get_or_create(
        email='admin@Pristine Woodspalace.com',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    admin_user.set_password('admin123')
    admin_user.save()

    # 2. Create Amenities
    amenity_names = ['Spa Access', 'Helicopter Transfer', 'Personal Butler', 'View of Lake St. Moritz', 'Ski-in/Ski-out']
    amenities = []
    for name in amenity_names:
        amenity, _ = Amenity.objects.get_or_create(name=name, defaults={'icon': 'Check'})
        amenities.append(amenity)

    # 3. Create Rooms
    room_data = [
        ('Palace Suite', 'Our grandest suite with panoramic alpine views.', 85000, 78000, 4),
        ('Deluxe Room', 'Classic elegance with modern comforts.', 35000, 32000, 2),
        ('Superior Suite', 'Spacious living area and king-size bed.', 55000, 52000, 3),
        ('Alpine Single', 'Cozy retreat for the solo traveler.', 18000, 16000, 1),
        ('Family Wing', 'Connected rooms for ultimate family comfort.', 115000, 110000, 6)
    ]

    rooms = []
    for name, desc, day_p, night_p, cap in room_data:
        room, created = Room.objects.get_or_create(
            name=name,
            defaults={
                'description': desc,
                'price_per_day': day_p,
                'price_per_night': night_p,
                'capacity': cap,
                'is_featured': True
            }
        )
        rooms.append(room)
        
        # Add a few amenities to each room
        for amenity in random.sample(amenities, 3):
            RoomAmenity.objects.get_or_create(room=room, amenity=amenity)

    # 4. Create some test users
    emails = ['royal@guest.com', 'alpine@traveler.ch', 'summer@visitor.eu']
    guests = []
    for email in emails:
        user, _ = User.objects.get_or_create(email=email)
        guests.append(user)

    # 5. Create Bookings
    print("Creating sample bookings...")
    for _ in range(12):
        room = random.choice(rooms)
        user = random.choice(guests)
        
        # Random dates in the past and future
        start_days = random.randint(-15, 15)
        stay_len = random.randint(2, 7)
        check_in = date.today() + timedelta(days=start_days)
        check_out = check_in + timedelta(days=stay_len)
        
        # Avoid creating duplicate bookings for the same day/room in a simple way
        if not Booking.objects.filter(room=room, check_in=check_in).exists():
            Booking.objects.create(
                user=user,
                room=room,
                check_in=check_in,
                check_out=check_out,
                total_days=stay_len,
                guests=random.randint(1, room.capacity),
                price_per_day=room.price_per_day,
                price_per_night=room.price_per_night,
                total_price=stay_len * room.price_per_day,
                status=random.choice(['pending', 'confirmed', 'confirmed', 'cancelled'])
            )

    print("Seeding complete! Admin user: admin@Pristine Woodspalace.com / admin123")

if __name__ == '__main__':
    seed_data()
