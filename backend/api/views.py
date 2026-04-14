from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import Machine, Product, Conversation, Message, ExchangeOffer
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

    # Метод 1
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_as_sold(self, request, pk=None):
        product = self.get_object()
        if product.seller != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        product.status = 'sold'
        product.save()
        return Response({'status': 'item marked as sold'})

    # Метод 2 (ТЕПЕР ВІН НА ОДНОМУ РІВНІ З ІНШИМИ)
    @action(detail=True, methods=['post'], url_path='favorite', permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        # Переконайся, що модель Favorite імпортована вгорі файлу!
        from .models import Favorite 
        
        favorite_query = Favorite.objects.filter(user=user, product=product)
        
        if favorite_query.exists():
            favorite_query.delete()
            return Response({'status': 'unfavorited', 'is_favorite': False}, status=status.HTTP_200_OK)
        
        Favorite.objects.create(user=user, product=product)
        return Response({'status': 'favorited', 'is_favorite': True}, status=status.HTTP_201_CREATED)
class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        try:
            user = User.objects.create_user(
                username=data.get('email'), 
                email=data.get('email'),
                password=data.get('password'),
                first_name=data.get('full_name', '')
            )
            user.role = data.get('role', 'student')
            user.room_number = data.get('room_number', '')
            
            dorm = data.get('dormitory')
            if dorm and str(dorm).isdigit():
                user.dormitory = int(dorm)
            user.save()

            # АВТО-СТВОРЕННЯ/ПРИЄДНАННЯ ДО ГРУПИ ГУРТОЖИТКУ
            if user.dormitory:
                # Шукаємо або створюємо чат типу 'group' для цього гуртожитку
                group_chat, created = Conversation.objects.get_or_create(
                    type='group',
                    dormitory_number=user.dormitory
                )
                # Додаємо юзера в учасники (якщо логіка передбачає ManyToMany для груп)
                group_chat.participants.add(user)

            return Response({"message": "Success"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        my_products = Product.objects.filter(seller=user)
        return Response({
            "profile": UserSerializer(user).data,
            "products": ProductSerializer(my_products, many=True).data
        })

    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated", "profile": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Авто-створення ГРУПОВОГО чату гуртожитку
        if user.dormitory:
            Conversation.objects.get_or_create(
                type='group', 
                dormitory_number=user.dormitory
            )
            
            # 2. Авто-створення чату з АДМІНОМ ЦЬОГО ГУРТОЖИТКУ
            # Шукаємо адміна, у якого номер гуртожитку збігається з юзером
            local_admin = User.objects.filter(role='admin', dormitory=user.dormitory).first()
            
            if local_admin and user.role != 'admin':
                # Перевіряємо, чи вже є приватний чат типу 'admin' між ними
                admin_chat = Conversation.objects.filter(
                    type='admin', 
                    participants=user
                ).filter(participants=local_admin).first()
                
                if not admin_chat:
                    new_chat = Conversation.objects.create(type='admin', dormitory_number=user.dormitory)
                    new_chat.participants.add(user, local_admin)

        # Повертаємо всі чати користувача
        return Conversation.objects.filter(
            Q(participants=user) | 
            Q(type='group', dormitory_number=user.dormitory)
        ).distinct().order_by('-created_at')
    def create(self, request, *args, **kwargs):
        receiver_id = request.data.get('receiver_id')
        if not receiver_id:
            return Response({"error": "receiver_id is required"}, status=400)

        # Переконуємося, що ми не створюємо чат самі з собою
        if str(receiver_id) == str(request.user.id):
            return Response({"error": "You cannot start a chat with yourself"}, status=400)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Шукаємо існуючий ПРИВАТНИЙ чат між цими двома юзерами
        conversation = Conversation.objects.filter(type='private')\
            .filter(participants=request.user)\
            .filter(participants=receiver).first()

        if not conversation:
            # Якщо чату немає — створюємо новий
            conversation = Conversation.objects.create(type='private')
            conversation.participants.add(request.user, receiver)

        return Response(ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED)
class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Отримуємо розмову
        conversation_id = self.request.data.get('conversation')
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Перевірка прав (як ми писали раніше)
            if conversation.type != 'group':
                if not conversation.participants.filter(id=self.request.user.id).exists():
                    # Якщо юзер не учасник, Django видасть помилку 403
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You are not a participant of this chat.")

            # Зберігаємо повідомлення, ПРИМУСОВО вказуючи sender
            serializer.save(sender=self.request.user, conversation=conversation)
            
        except Conversation.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"conversation": "Conversation not found."})

class GoogleLoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        google_url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}"
        response = requests.get(google_url)
        if response.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        email = user_data.get('email')
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': user_data.get('name', ''), 'role': 'student'}
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {'email': user.email, 'full_name': user.first_name, 'role': user.role}
        })
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Forbidden"}, status=403)

        # Отримуємо період з URL (за замовчуванням 7)
        period = int(request.query_params.get('period', 7))
        dorm = request.user.dormitory
        
        today = timezone.now().date()
        
        # Статистика
        total_students = User.objects.filter(dormitory=dorm, role='student').count()
        active_ads = Product.objects.filter(seller__dormitory=dorm, status='available').count()
        
        # Дані для графіка залежно від періоду
        chart_data = []
        for i in range(period - 1, -1, -1):
            date = today - timedelta(days=i)
            count = Message.objects.filter(
                conversation__dormitory_number=dorm, 
                created_at__date=date
            ).count()
            chart_data.append({
                "label": date.strftime("%d %b"), # Формат "13 Apr"
                "value": count
            })

        # Повертаємо структуру, яку очікує фронтенд
        return Response({
            "stats": [
                {"label": "Студентів", "value": total_students},
                {"label": "Оголошень", "value": active_ads},
                {"label": "Повідомлень сьогодні", "value": Message.objects.filter(conversation__dormitory_number=dorm, created_at__date=today).count()},
            ],
            "chart": chart_data
        })
# Останні 3 товари для дашборду
class LatestProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Повертаємо останні 3 товари з гуртожитку користувача
        return Product.objects.filter(
            seller__dormitory=self.request.user.dormitory,
            status='available'
        ).order_by('-created_at')[:3]

# Останні 3 повідомлення для дашборду
class RecentMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Повертаємо останні 3 повідомлення з чатів, де є користувач
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).order_by('-created_at')[:3]
