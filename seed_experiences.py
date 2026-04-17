import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from bookings.models import Experience

experiences = [
    {
        "name": "Estate Plantation Tour",
        "description": "A guided walk through our lush coffee and spice plantations. Learn about the 'Coorg Coffee' process and enjoy a fresh tasting session.",
        "price": 1500.00,
        "duration": "2.5 hours",
        "image_url": "https://images.unsplash.com/photo-1559592442-9e54d852cc5a?auto=format&fit=crop&q=80&w=800"
    },
    {
        "name": "Traditional Ayurvedic Spa",
        "description": "Rejuvenate your senses with a full-body Abhyanga massage using herbal oils crafted from local Coorg ingredients.",
        "price": 3500.00,
        "duration": "90 mins",
        "image_url": "https://images.unsplash.com/photo-1544161515-4af6b1d8b159?auto=format&fit=crop&q=80&w=800"
    },
    {
        "name": "Private Candlelight Dinner",
        "description": "A romantic 4-course dinner set under the stars in a private garden pavilion with a dedicated butler.",
        "price": 7500.00,
        "duration": "3 hours",
        "image_url": "https://images.unsplash.com/photo-1529636760656-e09213707fcf?auto=format&fit=crop&q=80&w=800"
    },
    {
        "name": "Bird Watching & Nature Trek",
        "description": "Explore the diverse avian life of the Western Ghats with our expert naturalist. Perfect for early risers.",
        "price": 800.00,
        "duration": "3 hours",
        "image_url": "https://images.unsplash.com/photo-1444464666168-49d633b867ad?auto=format&fit=crop&q=80&w=800"
    }
]

for exp in experiences:
    Experience.objects.get_or_create(
        name=exp['name'],
        defaults={
            'description': exp['description'],
            'price': exp['price'],
            'duration': exp['duration'],
            'image_url': exp['image_url']
        }
    )

print("Luxury Experiences seeded successfully!")
