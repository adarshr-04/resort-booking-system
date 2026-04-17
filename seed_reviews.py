import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import User, Room, Review

def seed_reviews():
    print("Gathering Guest Feedback for Coorg Pristine Woods...")
    
    # Sample reviews
    review_templates = [
        "Absolutely breathtaking views of the Alps. The service was impeccable.",
        "A truly royal experience. The personal butler was a nice touch.",
        "The most breakfast selection I've ever seen. Can't wait to return!",
        "St. Moritz at its best. The Palace Suite is worth every penny.",
        "Perfect for a winter getaway. The ski-in access is life-changing."
    ]

    rooms = list(Room.objects.all())
    users = list(User.objects.all())

    if not rooms or not users:
        print("Please run seed_data.py first!")
        return

    # Clear old reviews
    Review.objects.all().delete()

    for _ in range(10):
        room = random.choice(rooms)
        user = random.choice(users)
        Review.objects.create(
            user=user,
            room=room,
            rating=random.randint(4, 5),
            comment=random.choice(review_templates)
        )
        print(f"New review added for {room.name}")

    print("Guest Feedback Synchronized!")

if __name__ == '__main__':
    seed_reviews()
