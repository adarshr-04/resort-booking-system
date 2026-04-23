import razorpay
from django.conf import settings
import hashlib
import hmac

class RazorpayService:
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    def create_order(self, amount, currency='INR', receipt=None):
        """
        Create a Razorpay order.
        Amount should be in the smallest currency unit (e.g., paise for INR).
        """
        data = {
            'amount': int(amount * 100),  # Convert to paise
            'currency': currency,
            'receipt': receipt,
            'payment_capture': 1  # Auto capture
        }
        try:
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            print(f"Razorpay Order Creation Error: {e}")
            return None

    def verify_payment_signature(self, razorpay_order_id, razorpay_payment_id, razorpay_signature):
        """
        Verify the payment signature returned by Razorpay.
        """
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        try:
            # This will raise an error if verification fails
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            print(f"Razorpay Signature Verification Error: {e}")
            return False
