from django.core.mail import send_mail
from django.dispatch import receiver
from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    # Посилання має вести на порт 5173 (React)
    reset_url = f"http://localhost:5173/reset-password/{reset_password_token.key}"

    email_plaintext_message = f"Hello! Use this token to reset your password: {reset_url}"

    send_mail(
        "Password Reset for DormLife",
        email_plaintext_message,
        "noreply@dormlife.com",
        [reset_password_token.user.email]
    )

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import Message

@receiver(post_save, sender=Message)
def send_email_notification(sender, instance, created, **kwargs):
    # Перевіряємо, чи це саме створення нового запису (а не оновлення старого)
    if created:
        conversation = instance.conversation
        # Отримуємо всіх учасників, крім того, хто відправив
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