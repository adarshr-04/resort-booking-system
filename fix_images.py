import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import Room, RoomImage

def fix_images():
    print("Updating Room Images with Luxury Visuals...")
    
    # Mapping of room names to high-quality Unsplash luxury resort URLs
    image_map = {
        'Palace Suite': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200',
        'Deluxe Room': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200',
        'Superior Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200',
        'Alpine Single': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200',
        'Family Wing': 'https://images.unsplash.com/photo-1578683010236-d716f9759678?auto=format&fit=crop&q=80&w=1200'
    }

    for name, url in image_map.items():
        try:
            room = Room.objects.get(name=name)
            # Create the image link if it doesn't exist
            obj, created = RoomImage.objects.get_or_create(
                room=room,
                image=url,
                defaults={'alt_text': f"View of {name}"}
            )
            if created:
                print(f"Added image for {name}")
            else:
                print(f"Image already exists for {name}")
        except Room.DoesNotExist:
            print(f"Room {name} not found, skipping...")

    print("Image update complete!")

if __name__ == '__main__':
    fix_images()
