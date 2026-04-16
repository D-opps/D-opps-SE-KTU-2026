from rest_framework import serializers
from .models import User, Machine, Product, ProductPhoto, Message, Conversation, ExchangeOffer, Favorite
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role', 'dormitory', 'room_number', 'photo']

class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = '__all__'

class ProductPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPhoto
        fields = ['id', 'image']

class ProductSerializer(serializers.ModelSerializer):
    is_favorite = serializers.SerializerMethodField()
    seller_name = serializers.ReadOnlyField(source='seller.first_name')
    seller_id = serializers.ReadOnlyField(source='seller.id')

    class Meta:
        model = Product
        fields = ['id', 'title', 'description', 'price', 'image', 'category', 'seller_name', 'seller_id', 'status', 'is_favorite']

    def create(self, validated_data):
        request = self.context.get('view').request
        product = Product.objects.create(**validated_data)
        images_data = request.FILES.getlist('photos')
        for image_data in images_data:
            ProductPhoto.objects.create(product=product, image=image_data)
        return product
    def get_is_favorite(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False

# --- ОСНОВНІ ЗМІНИ ТУТ ---

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    # Додаємо read_only=True для sender
    sender = serializers.PrimaryKeyRelatedField(read_only=True) 
    timestamp = serializers.DateTimeField(source='created_at', format="%H:%M", read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'text', 'is_read', 'timestamp']
class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    # Важливо: витягуємо назву товару прямо в список чатів
    product_title = serializers.ReadOnlyField(source='product.title')
    
    class Meta:
        model = Conversation
        fields = ['id', 'type', 'participants', 'product', 'product_title', 'dormitory_number', 'messages', 'created_at']

class ExchangeOfferSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    target_product_title = serializers.ReadOnlyField(source='target_product.title')

    class Meta:
        model = ExchangeOffer
        fields = '__all__'