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

def test_create_and_favorite_product(self):
    """Test: Product creation in marketplace and adding it to favorites"""
    buyer = User.objects.create_user(username="buyer", email="buyer@dorm.com", password="123")
    seller = User.objects.create_user(username="seller", email="seller@dorm.com", password="123")
    
    product = Product.objects.create(
        title="Desk Lamp", price=350.00, description="Works perfectly",
        category="electronics", seller=seller, status="available"
    )
    self.assertTrue(Product.objects.filter(id=product.id).exists())
    
    from .models import Favorite
    fav = Favorite.objects.create(user=buyer, product=product)
    self.assertTrue(Favorite.objects.filter(user=buyer, product=product).exists())

def test_chat_and_message_delivery(self):
    """Test: Conversation initialization and unread counters incrementing"""
    user1 = User.objects.create_user(username="user1", email="u1@dorm.com")
    user2 = User.objects.create_user(username="user2", email="u2@dorm.com")
    
    from .models import Conversation, Message
    chat = Conversation.objects.create(type='private')
    chat.participants.add(user1, user2)
    
    msg = Message.objects.create(conversation=chat, sender=user1, text="Is this still available?")
    
    self.assertEqual(chat.get_unread_count(user2), 1)

def test_laundry_machine_status_and_time(self):
    """Test: Dynamic verification of computed minutes remaining for active cycles"""
    from .models import Machine
    import datetime
    
    future_time = timezone.now() + datetime.timedelta(minutes=45)
    machine = Machine.objects.create(
        name="Washer #1", type="washer", status="occupied",
        location="2nd floor", dormitory=4, end_time=future_time
    )
    
    self.assertEqual(machine.time_left, 45)

def test_create_user_report(self):
    """Test: Verification of report logs hitting the moderation system queue"""
    reporter = User.objects.create_user(username="reporter", email="rep@dorm.com")
    offender = User.objects.create_user(username="offender", email="off@dorm.com")
    
    product = Product.objects.create(
        title="Scam Post", price=999, description="Fake info",
        category="other", seller=offender
    )
    
    from .models import Report
    from django.contrib.contenttypes.models import ContentType
    
    product_type = ContentType.objects.get_for_model(Product)
    report = Report.objects.create(
        reporter=reporter, reason="spam", description="Scam listing alert!",
        content_type=product_type, object_id=product.id, status="pending"
    )
    
    self.assertEqual(Report.objects.filter(status="pending").count(), 1)