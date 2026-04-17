import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.serializers import BookingSerializer
from bookings.models import User, Room
import datetime

user = User.objects.first()
room = Room.objects.filter(name__icontains='Deluxe').first()

if user and room:
    print(f"Room: {room.name}, Price per night: {room.price_per_night}")
    data = {
        'user': user.id,
        'room': room.id,
        'check_in': datetime.date.today(),
        'check_out': datetime.date.today() + datetime.timedelta(days=1),
        'guests': 2,
    }
    
    serializer = BookingSerializer(data=data)
    if serializer.is_valid():
        validated = serializer.validated_data
        print(f"Total days: {validated['total_days']}")
        print(f"Total price calculated: {validated['total_price']}")
    else:
        print("Validation failed:", serializer.errors)
else:
    print("User or Room not found.")
