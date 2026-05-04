from rest_framework import serializers
from .models import User, Machine, Product, ProductPhoto, Message, Conversation, ExchangeOffer, Favorite, Notification
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role', 'dormitory', 'room_number', 'photo']

# serializers.py
class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        # Прибрали location, додали dormitory
        fields = ['id', 'name', 'type', 'status', 'time_left', 'dormitory', 'notes', 'reported_by']
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
        fields = ['id', 'title', 'description', 'price', 'image', 'category', 'seller_name', 'seller_id', 'status', 'is_favorite', "is_used"]

    def create(self, validated_data):
        request = self.context.get('view').request
        product = Product.objects.create(**validated_data)
        images_data = request.FILES.getlist('photos')
        for image_data in images_data:
            ProductPhoto.objects.create(product=product, image=image_data)
        return product
    def get_is_favorite(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            # Перевіряємо, чи існує запис у Favorite для цього продукту та юзера
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
    product_title = serializers.ReadOnlyField(source='product.title')
    #product_id = serializers.IntegerField(required=False, allow_null=True)
    #participants = UserSerializer(many=True, read_only=True)
    #receiver_id = serializers.CharField(required=False, allow_null=True)

    product_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    username = serializers.CharField(required=False, allow_null=True, write_only=True)
    receiver_id = serializers.CharField(required=False, allow_null=True, write_only=True)
    participants = UserSerializer(many=True, read_only=True)
    display_name = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = ['id', 'type', 'participants', 'product', 'product_title', 'dormitory_number', 'messages', 'created_at', 'product_id', 'receiver_id', 'username', 'display_name']
    def get_display_name(self, obj):
        request = self.context.get('request')
        user = request.user if request else None

        if obj.type == 'global_chat':
            return "🌍 Global Chat"

        if obj.type == 'group':
            return f"🏢 Dorm {obj.dormitory_number}"

        if obj.type == 'private':
            if not user:
                return "Private Chat"

            other = obj.participants.exclude(id=user.id).first()
            return other.first_name or other.username if other else "Private Chat"

        return f"Chat #{obj.id}"
    def create(self, validated_data):
        # 1. Видаляємо допоміжні поля з validated_data, щоб вони не потрапили в Conversation.objects.create()
        username = validated_data.pop('username', None)
        receiver_id = validated_data.pop('receiver_id', None)
        product_id = validated_data.pop('product_id', None)

        # 2. Отримуємо поточного користувача (відправника)
        request = self.context.get('request')
        current_user = request.user

        # 3. Створюємо саму бесіду
        conversation = Conversation.objects.create(**validated_data)

        # 4. Логіка додавання учасників
        participants = [current_user]
        
        # Шукаємо отримувача за ID або за Username
        if receiver_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            receiver = User.objects.filter(id=receiver_id).first()
            if receiver:
                participants.append(receiver)
        elif username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            receiver = User.objects.filter(username=username).first()
            if receiver:
                participants.append(receiver)

        # Додаємо всіх учасників у ManyToMany поле
        conversation.participants.set(participants)

        return conversation
    
class ExchangeOfferSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    target_product_title = serializers.ReadOnlyField(source='target_product.title')

    class Meta:
        model = ExchangeOffer
        fields = '__all__'

from .models import Event

class EventSerializer(serializers.ModelSerializer):
    creatorName = serializers.CharField(source='creator.first_name', read_only=True)
    attendees = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'date',
            'location',
            'dormitory',
            'creator',
            'creatorName',
            'attendees',
            'created_at'
        ]
        read_only_fields = ['creator', 'dormitory']

    def get_attendees(self, obj):
        return [
            {
                "userId": u.id,
                "name": u.first_name or u.username
            }
            for u in obj.attendees.all()
        ]


class NotificationSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%d.%m %H:%M", read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'description', 
            'target_id', 'is_read', 'created_at' # Тут має бути created_at
        ]
    