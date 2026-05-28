from rest_framework import serializers
from .models import User, Machine, Product, ProductPhoto, Message, Conversation, ExchangeOffer, Favorite, Notification, Report
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'role', 'dormitory', 'room_number', 'photo']

# serializers.py

from rest_framework import serializers
from .models import Report

from rest_framework import serializers
from .models import Report
from django.contrib.contenttypes.models import ContentType 

from rest_framework import serializers
from .models import Report, Product, User 

from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers
from .models import Report, Product, User 

class ReportSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reporter.first_name')
    reporter_email = serializers.ReadOnlyField(source='reporter.email')
    content_details = serializers.SerializerMethodField()
    model_name = serializers.CharField(write_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_name', 'reporter_email', 
            'reason', 'description', 'status', 'created_at', 
            'content_type', 'object_id', 'content_details', 'model_name'
        ]
        read_only_fields = ['reporter', 'status', 'created_at', 'content_type']

    def get_content_details(self, obj):
        target = obj.content_object
        return str(target) if target else "Об'єкт видалено"

    def create(self, validated_data):
        model_name = validated_data.pop('model_name').lower()
        
        try:
            from django.contrib.contenttypes.models import ContentType
            ctype = ContentType.objects.get(model=model_name)
            validated_data['content_type'] = ctype
        except Exception:
            raise serializers.ValidationError({"model_name": "Invalid model type"})

        validated_data['reporter'] = self.context['request'].user
        
        return super().create(validated_data)
    
class MachineSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.ReadOnlyField(source='reported_by.first_name')
    reported_by_email = serializers.ReadOnlyField(source='reported_by.email')
    class Meta:
        model = Machine
        fields = [
            'id',
            'name',
            'type',
            'status',
            'time_left',
            'dormitory',
            'location',
            'notes',
            'reported_by',
            'reported_by_name',
            'reported_by_email',
            'occupied_by',
            'end_time'
        ]
        read_only_fields = ['dormitory', 'reported_by']
        
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
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    sender = serializers.PrimaryKeyRelatedField(read_only=True) 
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'text', 'is_read', 'created_at']
class ConversationSerializer(serializers.ModelSerializer):
    
    messages = MessageSerializer(many=True, read_only=True)
    product_title = serializers.ReadOnlyField(source='product.title')
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
        username = validated_data.pop('username', None)
        receiver_id = validated_data.pop('receiver_id', None)
        product_id = validated_data.pop('product_id', None)
        request = self.context.get('request')
        current_user = request.user
        conversation = Conversation.objects.create(**validated_data)

        participants = [current_user]
        
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

    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'date',
            'end_date',   
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
    created_at = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'description', 
            'target_id', 'is_read', 'created_at'
        ]