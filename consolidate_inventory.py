
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import Room, Booking, RoomImage, Review, ServiceRequest

def consolidate():
    rooms = Room.objects.all()
    processed_types = {}

    for room in rooms:
        if ' #' in room.name:
            core_name = room.name.split(' #')[0]
            
            if core_name not in processed_types:
                # This becomes the master room for this type
                room.name = core_name
                room.total_inventory = 5
                room.save()
                processed_types[core_name] = room
                print(f"Set '{core_name}' as master room (ID: {room.id}, Inventory: 5)")
            else:
                master = processed_types[core_name]
                print(f"Merging '{room.name}' (ID: {room.id}) into master '{core_name}' (ID: {master.id})")
                
                # Move everything associated with this clone to the master
                Booking.objects.filter(room=room).update(room=master)
                RoomImage.objects.filter(room=room).update(room=master)
                Review.objects.filter(room=room).update(room=master)
                ServiceRequest.objects.filter(room=room).update(room=master)
                
                # Delete the clone
                room.delete()

if __name__ == '__main__':
    consolidate()
