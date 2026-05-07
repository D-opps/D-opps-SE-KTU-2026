from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Admin'),
        ('doorkeeper', 'Doorkeeper'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    dormitory = models.IntegerField(null=True, blank=True)
    room_number = models.CharField(max_length=10, blank=True, null=True)
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class Product(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    category = models.CharField(max_length=100)
    image = models.ImageField(upload_to='products/')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    status = models.CharField(max_length=20, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)    
    # ДОДАЙ ЦЕ:
    is_flagged = models.BooleanField(default=False)

class Machine(models.Model):
    TYPE_CHOICES = (('washer', 'Washer'), ('dryer', 'Dryer'))
    STATUS_CHOICES = (
        ('free', 'Free'), 
        ('occupied', 'Occupied'), 
        ('out-of-order', 'Out of order')
    )
    
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='free')
    location = models.CharField(max_length=100) # Назва (н-р: "2 поверх")
    
    # ЦЕ ПОЛЕ ОБОВ'ЯЗКОВЕ ДЛЯ ФІЛЬТРАЦІЇ:
    dormitory = models.IntegerField() 
    
    end_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    # Для аудиту:
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    last_reported_at = models.DateTimeField(auto_now=True)

    @property
    def time_left(self):
        if self.status == 'occupied' and self.end_time:
            from django.utils import timezone
            diff = self.end_time - timezone.now()
            return max(0, int(diff.total_seconds() / 60))
        return 0
    
class ProductPhoto(models.Model):
    product = models.ForeignKey(Product, related_name='photos', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')

    def __str__(self):
        return f"Photo for {self.product.title}"
    
# backend/api/models.py

class Conversation(models.Model):
    TYPE_CHOICES = (
        ('private', 'Private Chat'),       # Звичайний чат між юзерами
        ('market', 'Marketplace'),         # Чат по товару
        ('group', 'Dormitory Group'),      # Гуртожиток
        ('admin', 'Admin Support'),        # Підтримка
        ('global', 'Global Chat') 
    )
    
    type = models.CharField(
        max_length=10, 
        choices=TYPE_CHOICES, 
        default='private'
    )
    participants = models.ManyToManyField(User, related_name='conversations')
    
    # null=True та blank=True дозволяють створювати чати БЕЗ товару
    product = models.ForeignKey(
        'Product', # Використовуємо рядок, якщо модель Product нижче або в іншому файлі
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='conversations'
    )
    
    dormitory_number = models.IntegerField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.type == 'market' and self.product:
            return f"Market: {self.product.title}"
        if self.type == 'group':
            return f"Dormitory №{self.dormitory_number}"
        
        # Для приватних чатів виводимо список учасників
        usernames = ", ".join([u.username for u in self.participants.all()[:2]])
        return f"Private: {usernames}"
    def get_unread_count(self, user):
        """
        Рахує повідомлення, де:
        1. Повідомлення належить цій бесіді.
        2. Статус is_read = False.
        3. Відправник — НЕ цей користувач.
        """
        return self.messages.filter(is_read=False).exclude(sender=user).count()
class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    
    # Міняємо created_at на timestamp для зручності фронтенду (або залиш як є)
    created_at = models.DateTimeField(auto_now_add=True)
    is_flagged = models.BooleanField(default=False)
    class Meta:
        ordering = ['created_at'] # Важливо, щоб повідомлення йшли по порядку

class ExchangeOffer(models.Model):
    STATUS_CHOICES = (('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined'))
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_offers')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_offers')
    offered_item_name = models.CharField(max_length=200) # Назва товару, який пропонують на заміну
    target_product = models.ForeignKey(Product, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    location = models.CharField(max_length=255)

    dormitory = models.IntegerField()

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_events'
    )

    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='events_attending',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('message', 'New Message'),
        ('offer', 'Exchange Offer'),
        ('event', 'Upcoming Event'),
        ('system', 'System Update'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Ссилка на об'єкт (наприклад, ID товару або чату)
    target_id = models.CharField(max_length=255, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.user.email}"
    
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Report(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    )
    
    REASON_CHOICES = (
        ('spam', 'Spam/Advertising'),
        ('inappropriate', 'Inappropriate content'),
        ('fraud', 'Fraud/Scam'),
        ('other', 'Other'),
    )

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    
    # Generic Foreign Key дозволяє посилатися на Product або Message
    # Змініть це поле в моделі Report:
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True) # Додайте null=True і сюди про всяк випадок
    content_object = GenericForeignKey('content_type', 'object_id')
    
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Хто розглянув скаргу (Admin або Doorkeeper)
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_handled')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        # Використовуємо тернарний оператор для перевірки на None
        content_name = self.content_type.name if self.content_type else "Unknown Type"
        return f"Report by {self.reporter.username} on {content_name}"
    
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('signup', 'User Signup'),
        ('listing_created', 'Marketplace Listing Created'),
        ('chat_session', 'Active Chat Session'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']