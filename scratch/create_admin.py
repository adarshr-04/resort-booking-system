import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
email = 'adarshr2624@gmail.com'
password = 'Adarsh@123'

# Check if user already exists
if User.objects.filter(email=email).exists():
    user = User.objects.get(email=email)
    user.is_staff = True
    user.is_superuser = True
    user.set_password(password)
    user.save()
    print(f"User {email} already existed. Updated to Superuser and reset password.")
else:
    User.objects.create_superuser(email=email, password=password)
    print(f"Superuser {email} created successfully.")
