from django.contrib import admin
from .models import User, Product, Machine, ProductPhoto

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