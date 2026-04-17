import os
import sys
import django

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import Room, RoomImage, Amenity, RoomAmenity

def expand_resort():
    print("Expanding resort inventory to 25 rooms...")
    
    # Delete existing rooms and images to ensure a clean slate
    Room.objects.all().delete()
    
    room_types = [
        {
            'name': 'Palace Suite',
            'desc': 'Experience the pinnacle of luxury in our flagship suite, featuring royal decor and panoramic mountain views.',
            'price_day': 12000,
            'price_night': 15000,
            'capacity': 4
        },
        {
            'name': 'Deluxe Room',
            'desc': 'A perfect blend of comfort and style, our deluxe rooms offer a serene retreat with modern amenities.',
            'price_day': 8000,
            'price_night': 10000,
            'capacity': 2
        },
        {
            'name': 'Superior Suite',
            'desc': 'Spacious and elegant, the superior suite is designed for extended stays and luxurious relaxation.',
            'price_day': 10000,
            'price_night': 13000,
            'capacity': 3
        },
        {
            'name': 'Alpine Single',
            'desc': 'Cozy and sophisticated, ideal for the solo traveler seeking a tranquil escape in the heart of nature.',
            'price_day': 4000,
            'price_night': 5500,
            'capacity': 1
        },
        {
            'name': 'Family Wing',
            'desc': 'The ultimate family retreat, offering multiple rooms and ample space for the whole family to enjoy.',
            'price_day': 15000,
            'price_night': 18000,
            'capacity': 6
        }
    ]

    images = {
        'Palace Suite': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2074&auto=format&fit=crop',
        'Deluxe Room': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2074&auto=format&fit=crop',
        'Superior Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
        'Alpine Single': 'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?q=80&w=2070&auto=format&fit=crop',
        'Family Wing': 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=2074&auto=format&fit=crop'
    }

    # Ensure some basic amenities exist
    am_list = [
        ('WiFi', 'wifi'),
        ('Mini Bar', 'coffee'),
        ('Mountain View', 'mountain'),
        ('Private Balcony', 'sun')
    ]
    amenities = []
    for name, icon in am_list:
        am, _ = Amenity.objects.get_or_create(name=name, defaults={'icon': icon})
        amenities.append(am)

    room_count = 0
    for r_type in room_types:
        for i in range(1, 6): # 5 rooms of each type
            room_name = f"{r_type['name']} {100 + i + (len(room_types) * room_count)}" # Just unique names
            room_name = f"{r_type['name']} #{i}"
            
            room = Room.objects.create(
                name=room_name,
                description=r_type['desc'],
                price_per_day=r_type['price_day'],
                price_per_night=r_type['price_night'],
                capacity=r_type['capacity'],
                is_available=True,
                is_featured=(i == 1)
            )
            
            # Add Primary Image
            RoomImage.objects.create(
                room=room,
                image=images[r_type['name']],
                is_primary=True
            )
            
            # Add Amenities
            for am in amenities:
                RoomAmenity.objects.create(room=room, amenity=am)
            
            room_count += 1

    print(f"Success! Created {room_count} rooms across 5 categories.")

if __name__ == "__main__":
    expand_resort()
