from rest_framework import serializers
from .models import User, Machine, Product, ProductPhoto

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'dormitory', 'room_number', 'photo']

class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = '__all__'

# 1. ДОБАВЛЯЕМ ЭТОТ КЛАСС (Обязательно!)
class ProductPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPhoto
        fields = ['id', 'image']

class ProductSerializer(serializers.ModelSerializer):
    # Исправляем отображение продавца (чтобы в React было поле 'seller')
    seller = serializers.ReadOnlyField(source='seller.username')
    
    # Исправляем отображение фото (теперь это массив объектов с URL, а не UUID)
    photos = ProductPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        # Явно перечисляем поля, чтобы точно знать, что уходит на фронтенд
        fields = ['id', 'title', 'price', 'description', 'category', 'seller', 'photos']

    # Метод для корректного сохранения фото при создании товара через POST
    def create(self, validated_data):
        # Получаем файлы из запроса (React присылает их под ключом 'photos')
        request = self.context.get('view').request
        images_data = request.FILES.getlist('photos')
        
        product = Product.objects.create(**validated_data)
        
        # Создаем записи в таблице фотографий
        for image_data in images_data:
            ProductPhoto.objects.create(product=product, image=image_data)
            
        return product