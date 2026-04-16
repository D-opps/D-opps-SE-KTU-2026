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