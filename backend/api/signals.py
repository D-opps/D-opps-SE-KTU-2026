from django.core.mail import send_mail
from django.dispatch import receiver
from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created
from .models import Message, Notification
from django.db.models.signals import post_save

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

# @receiver(post_save, sender=Message)
# def create_message_notification(sender, instance, created, **kwargs):
#     if created:  # Якщо це нове повідомлення, а не редагування старого
#         Notification.objects.create(
#             user=instance.receiver,  # Кому прийде сповіщення
#             text=f"You received a new message from {instance.sender.username}",
#             link=f"/chat/{instance.sender.id}" # Куди клікнути
#         )

@receiver(post_save, sender=Message)
def create_notification_on_message(sender, instance, created, **kwargs):
    # Працюємо тільки якщо створено нове повідомлення
    if created:
        # Отримуємо всіх учасників чату
        participants = instance.conversation.participants.all()
        
        for participant in participants:
            # Не надсилаємо сповіщення самому собі (відправнику)
            if participant != instance.sender:
                Notification.objects.create(
                    user=participant,
                    notification_type='message',
                    title=f"New message from {instance.sender.username}",
                    description=instance.text[:50] + ("..." if len(instance.text) > 50 else ""),
                    target_id=str(instance.conversation.id),
                    is_read=False
                )