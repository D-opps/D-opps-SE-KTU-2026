from django.contrib import admin
from .models import User, Product, Machine, ProductPhoto, Notification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'dormitory')
    search_fields = ('username', 'email')

class ProductPhotoInline(admin.TabularInline):
    model = ProductPhoto
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'category', 'seller') 
    list_filter = ('category',)                            
    search_fields = ('title', 'description')              
    inlines = [ProductPhotoInline]                         

@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ('id', 'status') 
    list_filter = ('status',)

from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'dormitory_number', 'get_participants') 
    list_editable = ('type', 'dormitory_number')
    list_filter = ('type',)
    def get_participants(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])
    
    get_participants.short_description = 'Учасники'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'conversation')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
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