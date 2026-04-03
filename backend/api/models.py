from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

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

class Machine(models.Model):
    TYPE_CHOICES = (('washer', 'Washer'), ('dryer', 'Dryer'))
    STATUS_CHOICES = (('free', 'Free'), ('occupied', 'Occupied'), ('out-of-order', 'Out of order'))
    
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='free')
    time_left = models.IntegerField(default=0)

    def __str__(self):
        return self.name
    
class ProductPhoto(models.Model):
    product = models.ForeignKey(Product, related_name='photos', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')

    def __str__(self):
        return f"Photo for {self.product.title}"