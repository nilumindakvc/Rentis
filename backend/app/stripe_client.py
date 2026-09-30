import stripe

from app.config import settings

stripe.api_key = settings.stripe_secret_key
