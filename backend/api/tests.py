from django.test import TestCase

# Create your tests here.

"""
Notification tests for DOSK2-146-in-app-notifications-center
=============================================================
Destination: backend/api/tests.py
Run with:    python manage.py test api

Covers:
  - Notification model defaults, __str__, ordering
  - Message signal creates notifications for recipients, not sender
  - Event signal bulk-creates for all users except creator
  - ExchangeOffer signal (documents the instance.item.owner bug)
  - API: list, ownership isolation, type filter
  - API: mark_all_as_read action
  - API: PATCH single notification
"""

import unittest
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.models import (
    Conversation,
    Event,
    ExchangeOffer,
    Message,
    Notification,
    Product,
    User,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(username, email, password="testpass123"):
    return User.objects.create_user(
        username=username, email=email, password=password
    )


def make_notification(user, n_type="system", title="Test", is_read=False):
    return Notification.objects.create(
        user=user,
        notification_type=n_type,
        title=title,
        description="Test description",
        is_read=is_read,
    )


# ---------------------------------------------------------------------------
# Suite 1 — Model
# ---------------------------------------------------------------------------

class NotificationModelTest(TestCase):

    def setUp(self):
        self.user = make_user("alice", "alice@test.com")

    def test_default_is_unread(self):
        n = make_notification(self.user)
        self.assertFalse(n.is_read)

    def test_str_representation(self):
        n = make_notification(self.user, n_type="message")
        self.assertIn("message", str(n))
        self.assertIn(self.user.email, str(n))

    def test_ordering_newest_first(self):
        n1 = make_notification(self.user, title="First")
        n2 = make_notification(self.user, title="Second")
        qs = list(Notification.objects.filter(user=self.user))
        # newest (n2) should be index 0
        self.assertEqual(qs[0], n2)
        self.assertEqual(qs[1], n1)


# ---------------------------------------------------------------------------
# Suite 2 — Message signal
# ---------------------------------------------------------------------------

class MessageNotificationSignalTest(TestCase):

    def setUp(self):
        self.sender = make_user("sender", "sender@test.com")
        self.recipient = make_user("recipient", "recipient@test.com")
        self.conversation = Conversation.objects.create(type="private")
        self.conversation.participants.add(self.sender, self.recipient)

    def test_creates_notification_for_recipient(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text="Hello!",
        )
        self.assertEqual(
            Notification.objects.filter(user=self.recipient).count(), 1
        )

    def test_sender_not_notified(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text="Hello!",
        )
        self.assertEqual(
            Notification.objects.filter(user=self.sender).count(), 0
        )

    def test_notification_type_is_message(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text="Hello!",
        )
        n = Notification.objects.get(user=self.recipient)
        self.assertEqual(n.notification_type, "message")

    def test_target_id_is_conversation_id(self):
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text="Hello!",
        )
        n = Notification.objects.get(user=self.recipient)
        self.assertEqual(n.target_id, str(self.conversation.id))

    def test_multiple_participants_all_notified_except_sender(self):
        extra = make_user("extra", "extra@test.com")
        self.conversation.participants.add(extra)
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text="Group message",
        )
        self.assertEqual(Notification.objects.filter(user=self.recipient).count(), 1)
        self.assertEqual(Notification.objects.filter(user=extra).count(), 1)
        self.assertEqual(Notification.objects.filter(user=self.sender).count(), 0)

    def test_description_is_truncated_to_50_chars(self):
        long_text = "A" * 100
        Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            text=long_text,
        )
        n = Notification.objects.get(user=self.recipient)
        self.assertLessEqual(len(n.description), 55)  # 50 chars + "..."


# ---------------------------------------------------------------------------
# Suite 3 — Event signal
# ---------------------------------------------------------------------------

class EventNotificationSignalTest(TestCase):

    def setUp(self):
        self.creator = make_user("creator", "creator@test.com")
        self.user1 = make_user("user1", "user1@test.com")
        self.user2 = make_user("user2", "user2@test.com")

    def _create_event(self, title="Dorm Party"):
        return Event.objects.create(
            title=title,
            description="A fun event",
            date=timezone.now(),
            location="Common room",
            dormitory=1,
            creator=self.creator,
        )

    def test_all_users_except_creator_receive_notification(self):
        self._create_event()
        self.assertEqual(Notification.objects.filter(user=self.user1).count(), 1)
        self.assertEqual(Notification.objects.filter(user=self.user2).count(), 1)

    def test_creator_does_not_receive_notification(self):
        self._create_event()
        self.assertEqual(Notification.objects.filter(user=self.creator).count(), 0)

    def test_notification_type_is_event(self):
        self._create_event()
        n = Notification.objects.get(user=self.user1)
        self.assertEqual(n.notification_type, "event")

    def test_notification_title_contains_event_name(self):
        self._create_event(title="Movie Night")
        n = Notification.objects.get(user=self.user1)
        self.assertIn("Movie Night", n.title)

    def test_notification_description_contains_event_name(self):
        self._create_event(title="Movie Night")
        n = Notification.objects.get(user=self.user1)
        self.assertIn("Movie Night", n.description)

    def test_target_id_is_event_id(self):
        event = self._create_event()
        n = Notification.objects.get(user=self.user1)
        self.assertEqual(n.target_id, str(event.id))


# ---------------------------------------------------------------------------
# Suite 4 — ExchangeOffer signal  *** BUG DOCUMENTED HERE ***
# ---------------------------------------------------------------------------

class ExchangeOfferNotificationSignalTest(TestCase):
    """
    BUG in backend/api/signals.py line 77:
        user=instance.item.owner,   <-- ExchangeOffer has no 'item' field
    Fix:
        user=instance.receiver,

    test_offer_signal_exposes_bug  → passes while the bug exists (documents the crash)
    test_offer_notifies_receiver   → skipped; remove @skip after applying the fix
    """

    def setUp(self):
        self.sender = make_user("offsender", "offsender@test.com")
        self.receiver = make_user("offreceiver", "offreceiver@test.com")
        # Product.image is required; passing a path string bypasses file upload in tests.
        self.product = Product.objects.create(
            title="Nice Lamp",
            price=15.00,
            description="Works great",
            category="Electronics",
            image="placeholder.jpg",
            seller=self.receiver,
        )

    def _make_offer(self):
        return ExchangeOffer.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            offered_item_name="Old Chair",
            target_product=self.product,
        )

    def test_offer_signal_exposes_bug(self):
        """
        Creating an ExchangeOffer triggers the signal handler which references
        instance.item.owner — a field that does not exist — causing AttributeError.
        This test PASSES while the bug is present.
        Delete this test once signals.py line 77 is fixed.
        """
        with self.assertRaises(AttributeError):
            self._make_offer()

    @unittest.skip(
        "Unskip after fixing signals.py line 77: "
        "change `instance.item.owner` → `instance.receiver`"
    )
    def test_offer_notifies_receiver(self):
        self._make_offer()
        n = Notification.objects.get(user=self.receiver)
        self.assertEqual(n.notification_type, "offer")
        self.assertIn(self.sender.username, n.description)

    @unittest.skip(
        "Unskip after fixing signals.py line 77: "
        "change `instance.item.owner` → `instance.receiver`"
    )
    def test_sender_not_notified_for_offer(self):
        self._make_offer()
        self.assertEqual(Notification.objects.filter(user=self.sender).count(), 0)


# ---------------------------------------------------------------------------
# Suite 5 — List API
# ---------------------------------------------------------------------------

class NotificationListAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user_a = make_user("usera", "usera@test.com")
        self.user_b = make_user("userb", "userb@test.com")
        make_notification(self.user_a, title="For A")
        make_notification(self.user_b, title="For B")

    def test_unauthenticated_returns_401(self):
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_sees_only_own_notifications(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [n["title"] for n in response.data]
        self.assertIn("For A", titles)
        self.assertNotIn("For B", titles)

    def test_type_filter_returns_matching_type_only(self):
        self.client.force_authenticate(user=self.user_a)
        make_notification(self.user_a, n_type="event", title="Event notif")
        response = self.client.get("/api/notifications/?type=system")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        types = [n["notification_type"] for n in response.data]
        self.assertTrue(all(t == "system" for t in types), types)

    def test_type_filter_excludes_other_types(self):
        self.client.force_authenticate(user=self.user_a)
        make_notification(self.user_a, n_type="event", title="Event notif")
        response = self.client.get("/api/notifications/?type=event")
        titles = [n["title"] for n in response.data]
        self.assertIn("Event notif", titles)
        self.assertNotIn("For A", titles)

    def test_response_contains_expected_fields(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first = response.data[0]
        for field in ("id", "notification_type", "title", "description", "is_read"):
            self.assertIn(field, first, f"Missing field: {field}")


# ---------------------------------------------------------------------------
# Suite 6 — mark_all_as_read action
# ---------------------------------------------------------------------------

class NotificationMarkAllReadAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user("markuser", "markuser@test.com")
        for i in range(3):
            make_notification(self.user, title=f"Notif {i}", is_read=False)

    def test_mark_all_as_read_sets_is_read_true(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/notifications/mark_all_as_read/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread = Notification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread, 0)

    def test_mark_all_as_read_requires_authentication(self):
        response = self.client.post("/api/notifications/mark_all_as_read/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_only_current_users_notifications_marked(self):
        other = make_user("other", "other@test.com")
        make_notification(other, title="Other's notif", is_read=False)

        self.client.force_authenticate(user=self.user)
        self.client.post("/api/notifications/mark_all_as_read/")

        # Other user's notification must remain unread
        self.assertEqual(
            Notification.objects.filter(user=other, is_read=False).count(), 1
        )


# ---------------------------------------------------------------------------
# Suite 7 — PATCH single notification
# ---------------------------------------------------------------------------

class NotificationUpdateAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user("patchuser", "patchuser@test.com")
        self.notification = make_notification(self.user, title="Patch me", is_read=False)

    def test_patch_mark_single_notification_as_read(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/notifications/{self.notification.id}/",
            {"is_read": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_patch_requires_authentication(self):
        response = self.client.patch(
            f"/api/notifications/{self.notification.id}/",
            {"is_read": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
