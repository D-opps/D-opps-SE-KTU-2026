from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response

# Отримуємо твою кастомну модель User
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import Favorite, Machine, Product, Conversation, Message, ExchangeOffer
from .serializers import (
    UserSerializer, MachineSerializer, ProductSerializer, 
    ConversationSerializer, MessageSerializer, ExchangeOfferSerializer
)
from rest_framework.views import APIView
import requests
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        # Шукаємо існуючий запис у таблиці Favorite
        # Ми звертаємося до моделі Favorite безпосередньо
        favorite_exists = Favorite.objects.filter(user=user, product=product).first()

        if favorite_exists:
            # Якщо запис є — видаляємо його (прибираємо з обраного)
            favorite_exists.delete()
            return Response({'is_favorite': False}, status=status.HTTP_200_OK)
        else:
            # Якщо запису немає — створюємо (додаємо в обране)
            # Тут ми явно створюємо об'єкт Favorite, як того хоче Django
            Favorite.objects.create(user=user, product=product)
            return Response({'is_favorite': True}, status=status.HTTP_201_CREATED)
class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        try:
            # Створюємо юзера
            user = User.objects.create_user(
                username=data.get('email'), 
                email=data.get('email'),
                password=data.get('password'),
            )
            # Записуємо повне ім'я в first_name (або кастомне поле, якщо воно є в моделі)
            user.first_name = data.get('full_name', '')
            user.role = data.get('role', 'student')
            user.room_number = data.get('room_number', '')
            
            dorm = data.get('dormitory')
            if dorm and str(dorm).isdigit():
                user.dormitory = int(dorm)

            user.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Повертаємо зрозумілу помилку
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        
        # Використовуємо userinfo замість tokeninfo для access_token
        google_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}"
        response = requests.get(google_url)
        
        if response.status_code != 200:
            return Response({"error": "Invalid Google token", "details": response.text}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        email = user_data.get('email')
        first_name = user_data.get('given_name', user_data.get('name', ''))

        # Шукаємо або створюємо користувача
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': first_name,
                'role': 'student'
            }
        )

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'email': user.email,
                'full_name': user.first_name,
                'role': user.role
            }
        })
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).distinct()

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        # Ми можемо отримати receiver_id або витягнути його прямо з продукту
        receiver_id = request.data.get('receiver_id')
        
        if not product_id:
            return Response({"error": "product_id is required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
            seller = product.seller
            
            if seller == request.user:
                return Response({"error": "You cannot start a conversation with yourself"}, status=400)

            # Шукаємо існуючий чат між цими двома людьми щодо цього продукту
            conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=seller
            ).filter(product=product).first()

            if not conversation:
                # Якщо чату немає — створюємо
                conversation = Conversation.objects.create(product=product)
                conversation.participants.add(request.user, seller)

            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=201)

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    @action(detail=False, methods=['get'])
    def dormitory_chat(self, request):
        user = request.user
        if not user.dormitory:
            return Response({"error": "User has no dormitory assigned"}, status=400)

        # Шукаємо чат саме для цього номера гуртожитку
        conversation, created = Conversation.objects.get_or_create(
            type='group',
            dormitory_number=user.dormitory,
            defaults={'product': None}
        )
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        user = request.user
        # Отримуємо період з параметрів запиту (дефолт 7 днів)
        period = int(request.query_params.get('period', 7))
        date_from = timezone.now() - timedelta(days=period)
        
        # Визначаємо гуртожиток користувача
        user_dorm = getattr(user, 'dormitory', None)

        # Якщо у користувача не вказано гуртожиток, можна або видати помилку, 
        # або (якщо це СуперАдмін) показати все.
        if not user_dorm:
            return Response({"error": "No dormitory assigned to user"}, status=400)

        # Фільтруємо всі дані за гуртожитком
        # Припускаємо, що у моделей User та Product є поле dormitory
        # А у Message та Machine можна вийти через зв'язки
        
        return Response({
            "totalUsers": User.objects.filter(dormitory=user_dorm).count(),
            "verifiedUsers": User.objects.filter(dormitory=user_dorm, is_active=True).count(),
            
            "totalMessages": Message.objects.filter(
                conversation__dormitory_number=user_dorm # якщо в конверсації є номер дорму
            ).count(),
            
            "totalListings": Product.objects.filter(seller__dormitory=user_dorm).count(),
            "activeListings": Product.objects.filter(
                seller__dormitory=user_dorm, 
                status='available'
            ).count(),
            
            "dormitoryNumber": user_dorm # Повертаємо номер для заголовка на фронті
        })

    # views.py у класі ConversationViewSet або окремим методом
    @action(detail=False, methods=['get'])
    def recent_messages(self, request):
        # Фільтруємо повідомлення: тільки ті, де користувач є учасником чату
        messages = Message.objects.filter(
            conversation__participants=request.user
        ).order_by('-created_at')[:3]
        
        data = [{
            "id": m.id,
            "sender_name": m.sender.first_name or m.sender.username,
            "text": m.text,
            "timestamp": m.created_at.strftime("%H:%M")
        } for m in messages]
        return Response(data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Повідомлення лише з чатів, де є користувач
        return Message.objects.filter(
            conversation__participants=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        try:
            user = request.user
            
            # Фільтруємо товари
            my_products = Product.objects.filter(seller=user)
            
            # ВАЖЛИВО: Передаємо context={'request': request}
            # Це виправить помилку 'NoneType' object has no attribute 'user'
            products_data = ProductSerializer(
                my_products, 
                many=True, 
                context={'request': request}
            ).data

            photo_url = None
            if user.photo:
                try:
                    photo_url = user.photo.url
                except:
                    photo_url = None

            return Response({
                "profile": {
                    "first_name": user.first_name or "User",
                    "email": user.email,
                    "dormitory": getattr(user, 'dormitory', ''),
                    "room_number": getattr(user, 'room_number', ''),
                    "photo": photo_url,
                    "role": getattr(user, 'role', 'student'),
                },
                "products": products_data
            })
        except Exception as e:
            import traceback
            print(traceback.format_exc()) # Це виведе повний шлях помилки в термінал
            return Response({"error": str(e)}, status=500)

    def patch(self, request):
        # Робимо те саме для методу PATCH
        try:
            user = request.user
            data = request.data

            user.first_name = data.get('first_name', user.first_name)
            user.room_number = data.get('room_number', user.room_number)
            if 'dormitory' in data:
                user.dormitory = data.get('dormitory')
            if 'photo' in request.FILES:
                user.photo = request.FILES['photo']
            user.save()

            my_products = Product.objects.filter(seller=user)
            products_data = ProductSerializer(
                my_products, 
                many=True, 
                context={'request': request}
            ).data

            return Response({
                "profile": {
                    "first_name": user.first_name,
                    "email": user.email,
                    "dormitory": user.dormitory,
                    "room_number": user.room_number,
                    "photo": user.photo.url if user.photo else None,
                    "role": getattr(user, 'role', 'student'),
                },
                "products": products_data
            })
        except Exception as e:
            print(f"PATCH ERROR: {e}")
            return Response({"error": str(e)}, status=500)