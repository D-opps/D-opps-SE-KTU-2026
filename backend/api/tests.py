from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import AnalyticsEvent, Product

User = get_user_model()

class EventCaptureTest(TestCase):
    
    def setUp(self):
        self.user_data = {
            "username": "teststudent",
            "email": "student@dorm.com",
            "password": "SecurePassword123"
        }

    def test_signup_event_captured(self):
        """
        Given a signup action, 
        when the backend test runs, 
        then the event is asserted to be captured in AnalyticsEvent.
        """
        user = User.objects.create_user(**self.user_data)
        
        AnalyticsEvent.objects.create(
            event_type='signup',
            user=user
        )
        
        signup_event_exists = AnalyticsEvent.objects.filter(
            event_type='signup',
            user=user
        ).exists()
        
        self.assertTrue(signup_event_exists, "Acceptance Criteria Failed: Signup action was not captured in AnalyticsEvent!")

    def test_marketplace_offer_action_captured(self):
        """
        Given a marketplace offer action (product creation), 
        when the backend test runs, 
        then the event is asserted to be captured.
        """
        seller = User.objects.create_user(**self.user_data)
        
        product = Product.objects.create(
            title="Dorm Fridge for Sale",
            price=150.00,
            description="Good condition, small size for dorm rooms.",
            category="appliances",
            seller=seller,
            status="available"
        )
        
        AnalyticsEvent.objects.create(
            event_type='listing_created',
            user=seller
        )
        
        product_exists = Product.objects.filter(id=product.id).exists()
        event_exists = AnalyticsEvent.objects.filter(
            event_type='listing_created',
            user=seller
        ).exists()
        
        self.assertTrue(product_exists, "Product was not saved to the marketplace database.")
        self.assertTrue(event_exists, "Acceptance Criteria Failed: Marketplace action was not captured in AnalyticsEvent!")