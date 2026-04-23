import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Set environment variable for settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resort_project.settings')
django.setup()

def test_email():
    try:
        print("Attempting to send test email...")
        subject = "Coorg Pristine Woods — SMTP Test"
        message = "This is a test email to verify that the SMTP configuration is working correctly for the resort booking system."
        recipient = "Intern@pirlanta.in" # Sending to self for verification
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("Success! The email was sent successfully.")
    except Exception as e:
        print(f"Error: Failed to send email. {str(e)}")

if __name__ == "__main__":
    test_email()
