from sched import Event

from django.core.mail import send_mail
from django.dispatch import receiver
from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created
from .models import Message, Notification, User, ExchangeOffer, Event
from django.db.models.signals import post_save

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    reset_url = f"http://localhost:5173/reset-password/{reset_password_token.key}"

    email_plaintext_message = f"Hello! Use this token to reset your password: {reset_url}"

    send_mail(
        "Password Reset for DormLife",
        email_plaintext_message,
        "noreply@dormlife.com",
        [reset_password_token.user.email]
    )

@receiver(post_save, sender=Message)
def send_email_notification(sender, instance, created, **kwargs):
    if created:
        conversation = instance.conversation
        recipients = conversation.participants.exclude(id=instance.sender.id)

        for recipient in recipients:
            if recipient.email:
                subject = f"New message from {instance.sender.username}"
                message_text = f"Hello, {recipient.first_name}!\n\nYou have received a message: '{instance.text[:50]}...'\n\nView it in the DormLife app."
                
                send_mail(
                    subject,
                    message_text,
                    'noreply@dormlife.com',
                    [recipient.email],
                    fail_silently=True,
                )


@receiver(post_save, sender=Message)
def create_notification_on_message(sender, instance, created, **kwargs):
    if created:
        participants = instance.conversation.participants.all()
        
        for participant in participants:
            if participant != instance.sender:
                Notification.objects.create(
                    user=participant,
                    notification_type='message',
                    title=f"New message from {instance.sender.username}",
                    description=instance.text[:50] + ("..." if len(instance.text) > 50 else ""),
                    target_id=str(instance.conversation.id),
                    is_read=False
                )

@receiver(post_save, sender=ExchangeOffer)
def create_notification_on_offer(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance.item.owner, 
            notification_type='offer',
            title="New Exchange Offer!",
            description=f"User {instance.sender.username} wants to exchange items.",
            target_id=str(instance.id)
        )

@receiver(post_save, sender=Event)
def create_notification_on_event(sender, instance, created, **kwargs):
    if created:
        users = User.objects.exclude(id=instance.creator.id)
        
        notifications = []
        for user in users:
            notifications.append(
                Notification(
                    user=user,
                    notification_type='event',
                    title=f"New Event: {instance.title}", 
                    description=f"We invite you to join {instance.title} on {instance.date.strftime('%d.%m')}.", 
                    target_id=str(instance.id)
                )
            )
        
        Notification.objects.bulk_create(notifications)
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AnalyticsEvent, User

@receiver(post_save, sender=User)
def track_signup(sender, instance, created, **kwargs):
    if created:
        AnalyticsEvent.objects.create(event_type='signup', user=instance)