from django.contrib import admin
from .models import User, Product, Machine, ProductPhoto, Notification

# 1. Регистрация Пользователей (чтобы видеть роли и общежития)
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'dormitory')
    search_fields = ('username', 'email')

# 2. Настройка для ФОТО (чтобы добавлять их прямо ВНУТРИ продукта)
class ProductPhotoInline(admin.TabularInline):
    model = ProductPhoto
    extra = 1

# 3. Регистрация ПРОДУКТОВ (Marketplace)
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'category', 'seller') # Колонки в списке
    list_filter = ('category',)                            # Фильтр справа
    search_fields = ('title', 'description')               # Поиск сверху
    inlines = [ProductPhotoInline]                         # Позволяет грузить фото сразу в продукте

@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    # Убираем 'dormitory', оставляем только то, что точно есть в базе (id и status)
    list_display = ('id', 'status') 
    list_filter = ('status',)

# backend/api/admin.py
# backend/api/admin.py
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    # Залишаємо тільки базові поля. 
    # Якщо 'dormitory_number' теж видасть помилку — видали і його з списку.
    list_display = ('id', 'type', 'dormitory_number', 'get_participants') 
    list_editable = ('type', 'dormitory_number')
    list_filter = ('type',)
    def get_participants(self, obj):
        # Покаже список юзернеймів через кому
        return ", ".join([user.username for user in obj.participants.all()])
    
    get_participants.short_description = 'Учасники'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    # В моделі Message поле часу часто називається 'created_at' або 'date_posted'.
    # Поки що залишимо тільки ID, відправника та чат.
    list_display = ('id', 'sender', 'conversation')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    # Використовуємо реальні імена полів: title та description
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at') 
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'description', 'user__email')

from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'reason', 'reporter', 'status', 'created_at')
    list_filter = ('status', 'reason')
    search_fields = ('description',)