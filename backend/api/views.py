
from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response

# Отримуємо твою кастомну модель User
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import Favorite, Machine, Product, Conversation, Message, ExchangeOffer, Event, User, Notification, Report
from .serializers import (
    UserSerializer, MachineSerializer, ProductSerializer, 
    ConversationSerializer, MessageSerializer, ExchangeOfferSerializer, EventSerializer, NotificationSerializer, ReportSerializer
)
from rest_framework.views import APIView
import requests
from rest_framework.decorators import action, api_view
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()
from rest_framework.decorators import api_view, permission_classes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_user_by_email(request):
    email = request.query_params.get('email')

    if not email:
        return Response({"error": "email required"}, status=400)

    user = User.objects.filter(email=email).first()

    if not user:
        return Response({"error": "not found"}, status=404)

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })# views.py
@api_view(['GET'])
def get_me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
class MachineViewSet(viewsets.ModelViewSet):
    serializer_class = MachineSerializer
    permission_classes = [permissions.IsAuthenticated] # Базовий захист

    def get_queryset(self):
        user = self.request.user
        # Авто-звільнення машинок, у яких вийшов час
        from django.utils import timezone
        Machine.objects.filter(
            status='occupied', 
            end_time__lte=timezone.now()
        ).update(status='free', end_time=None)

        # Фільтрація: тільки машинки МОГО гуртожитку
        return Machine.objects.filter(dormitory=user.dormitory)

    @action(detail=True, methods=['post'])
    def report_status(self, request, pk=None):
        machine = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        # Перевірка на валідність статусу
        valid_statuses = ['free', 'occupied', 'out-of-order']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Оновлюємо базові поля для аудиту
        machine.status = new_status
        machine.notes = notes
        machine.reported_by = request.user
        machine.last_reported_at = timezone.now()

        # 2. Логіка таймера
        if new_status == 'occupied':
            # Беремо хвилини з запиту, або 30 за дефолтом
            try:
                minutes = int(request.data.get('minutes', 30))
            except (ValueError, TypeError):
                minutes = 30
            machine.end_time = timezone.now() + timedelta(minutes=minutes)
        
        elif new_status == 'free':
            # Якщо вільна — скидаємо час завершення
            machine.end_time = None
            machine.notes = '' # Очищаємо нотатки, якщо машинку полагодили/звільнили

        machine.save()
        
        # Повертаємо оновлені дані, щоб фронтенд відразу їх побачив
        serializer = self.get_serializer(machine)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        product = serializer.save(seller=self.request.user)
        AnalyticsEvent.objects.create(event_type='listing_created', user=self.request.user)
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
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Register first"}, status=403)

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
        username = request.data.get('username')
        chat_type = request.data.get('type')  # Отримуємо тип 'global' або 'dormitory'

        # --- СЦЕНАРІЙ 0: СПЕЦІАЛЬНІ ЧАТИ (Global/Dorm) ---
        if chat_type in ['global', 'dormitory']:

            if chat_type == 'dormitory':
                dorm_num = request.user.dormitory

                conversation = Conversation.objects.filter(
                    type='group',
                    dormitory_number=dorm_num
                ).first()

                print("USER:", request.user.username)
                print("DORM:", dorm_num)

                if not conversation:
                    conversation = Conversation.objects.create(
                        type='group',
                        dormitory_number=dorm_num
                    )

            else:
                conversation = Conversation.objects.filter(type='global_chat').first()

                if not conversation:
                    conversation = Conversation.objects.create(
                        type='global_chat'
                    )

            # Додаємо юзера в учасники, якщо його там ще немає
            if request.user not in conversation.participants.all():
                conversation.participants.add(request.user)

            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=200)

        # --- СЦЕНАРІЙ 1: ЧАТ ПО ТОВАРУ (Твій старий код) ---
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
                opponent = product.seller
                if opponent == request.user:
                    return Response({"error": "You cannot start a conversation with yourself"}, status=400)

                conversation = Conversation.objects.filter(
                    product=product,
                    participants=request.user
                ).filter(participants=opponent).first()

                if not conversation:
                    conversation = Conversation.objects.create(product=product, type='private')
                    conversation.participants.add(request.user, opponent)

                serializer = self.get_serializer(conversation)
                return Response(serializer.data, status=201)
            except Product.DoesNotExist:
                return Response({"error": "Product not found"}, status=404)

        # --- СЦЕНАРІЙ 2: ПРИВАТНИЙ ЧАТ (Твій старий код) ---
        elif username:
            opponent = User.objects.filter(
                Q(username__iexact=username) | Q(email__iexact=username)
            ).first()

            if not opponent:
                return Response({"error": "User not found"}, status=404)
            
            if opponent == request.user:
                return Response({"error": "You cannot chat with yourself"}, status=400)

            conversation = Conversation.objects.filter(
                product__isnull=True,
                type='private',
                participants=request.user
            ).filter(participants=opponent).first()

            if not conversation:
                conversation = Conversation.objects.create(type='private')
                conversation.participants.add(request.user, opponent)

            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=201)

        return Response({"error": "Send product_id, username or type"}, status=400)   
    @action(detail=False, methods=['get'])
    def dormitory_chat(self, request):
            user = request.user
            if not user.dormitory: # Перевір, чи поле називається dormitory чи dormitory_number у твоїй моделі User
                return Response({"error": "Гуртожиток не вказано"}, status=400)

            # Знаходимо або створюємо чат
            chat, created = Conversation.objects.get_or_create(
                type='group',
                dormitory_number=user.dormitory # Або user.dormitory_number
            )
            
            # Додаємо юзера до учасників, якщо його там немає
            if user not in chat.participants.all():
                chat.participants.add(user)

            serializer = self.get_serializer(chat)
            return Response(serializer.data) # ЦЕЙ РЯДОК МАЄ БУТИ ОБОВ'ЯЗКОВО  
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
    @action(detail=False, methods=['get'])
    def global_chat(self, request):
        # Використовуємо тільки ті поля, які є в моделі.
        # Якщо 'name' немає, ми можемо ідентифікувати глобальний чат просто за типом.
        conv, created = Conversation.objects.get_or_create(
            type='GLOBAL',
            # Якщо у тебе немає поля для назви, просто прибери defaults або 
            # використай існуюче поле, наприклад product_title (якщо це допустимо)
            #defaults={'product_title': 'Global Student Chat'} 
        )
        
        # Додаємо користувача до чату
        if request.user not in conv.participants.all():
            conv.participants.add(request.user)
            
        serializer = self.get_serializer(conv)
        return Response(serializer.data)
    def retrieve(self, request, *args, **kwargs):
        # 1. Отримуємо об'єкт бесіди
        instance = self.get_object()
        
        # 2. Оновлюємо статус повідомлень:
        # Всі повідомлення в цьому чаті, які:
        # - ще не прочитані (is_read=False)
        # - відправлені НЕ поточним користувачем (exclude(sender=request.user))
        instance.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        
        # 3. Повертаємо дані як зазвичай
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.all().order_by('-date')

    def perform_create(self, serializer):
        serializer.save(
            creator=self.request.user,
            dormitory=self.request.user.dormitory
        )

    # 🔥 OLD (leave for backward compatibility)
    @action(detail=True, methods=['post'])
    def rsvp(self, request, pk=None):
        return self._toggle_attendance(request, pk)

    # 🔥 NEW CLEAN NAME
    @action(detail=True, methods=['post'])
    def toggle_attendance(self, request, pk=None):
        return self._toggle_attendance(request, pk)

    def _toggle_attendance(self, request, pk):
        event = self.get_object()
        user = request.user

        if user in event.attendees.all():
            event.attendees.remove(user)
            attending = False
        else:
            event.attendees.add(user)
            attending = True

        return Response({
            "success": True,
            "attending": attending,
            "event": EventSerializer(event).data
        })
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Користувач бачить лише свої сповіщення, найновіші зверху
        print(f"DEBUG: Поточний користувач -> {self.request.user}") # Додайте цей рядок
        queryset = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        
        # Можливість фільтрації за типом через URL: /api/notifications/?type=offer
        n_type = self.request.query_params.get('type')
        if n_type:
            queryset = queryset.filter(notification_type=n_type)
        return queryset

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Метод для позначення всіх сповіщень прочитаними за один клік"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'}, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        """Дозволяє оновити статус окремого сповіщення (наприклад, mark as read)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
from django.contrib.contenttypes.models import ContentType
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class IsAdminOrDoorkeeper(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role in ['admin', 'doorkeeper'])

# 1. Створення скарги (для студента)
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer

# 1. Створення скарги (тепер він точно існує)
class CreateReportView(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):

        content_type_id = self.request.data.get("content_type")
        object_id = self.request.data.get("object_id")

        reported_user = None

        if content_type_id and object_id:
            from django.contrib.contenttypes.models import ContentType

            ct = ContentType.objects.get(id=content_type_id)
            model = ct.model_class()
            obj = model.objects.get(id=object_id)

            if hasattr(obj, "seller"):
                reported_user = obj.seller
            elif hasattr(obj, "sender"):
                reported_user = obj.sender
            elif hasattr(obj, "user"):
                reported_user = obj.user

        report = serializer.save(
            reporter=self.request.user,
            reported_user=reported_user
        )

        # 🔥 NOTIFY ADMINS HERE
        admins = User.objects.filter(role__in=["admin", "doorkeeper"])

        for admin in admins:
            Notification.objects.create(
                user=admin,
                notification_type="system",
                title="New report submitted",
                description=f"New report from {self.request.user.email}",
                target_id=str(report.id)
            )
        print("REPORT:", report.id)
        print("REPORTED USER:", report.reported_user)
        print("CONTENT OBJECT:", report.content_object)


from django.utils import timezone
from .models import Notification
# 2. Універсальний в'юсет (об'єднали два дублікати в один)
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Це дозволяє робити POST на /api/reports/manage/3/perform_action/
    @action(detail=True, methods=['post'])
    def perform_action(self, request, pk=None):
        report = self.get_object()
        action_type = request.data.get('action')

        obj = report.content_object  # 🔥 ОЦЕ НАДІЙНО

        reported_user = None

        if obj:
            if hasattr(obj, "seller"):
                reported_user = obj.seller
            elif hasattr(obj, "sender"):
                reported_user = obj.sender
            elif hasattr(obj, "user"):
                reported_user = obj.user

        if action_type == 'dismiss':
            report.status = 'dismissed'

            Notification.objects.create(
                user=report.reporter,
                notification_type='system',
                title='Your report was reviewed',
                description='Admin reviewed your report. No action was taken.',
            )

        elif action_type == 'remove':
            if obj:
                obj.delete()

            report.status = 'resolved'

            Notification.objects.create(
                user=report.reporter,
                notification_type='system',
                title='Report resolved',
                description='Reported content was removed.',
            )

            if reported_user:
                Notification.objects.create(
                    user=reported_user,
                    notification_type='system',
                    title='Content violation',
                    description='Your content was removed after a report.',
                )

        elif action_type == 'warn':
            report.status = 'resolved'

            Notification.objects.create(
                user=report.reporter,
                notification_type='system',
                title='Report resolved',
                description='User has been warned.',
            )

            if reported_user:
                Notification.objects.create(
                    user=reported_user,
                    notification_type='system',
                    title='Warning',
                    description='You received a warning due to a report.',
                )

        else:
            return Response({"error": "Unknown action"}, status=400)

        report.handled_by = request.user
        report.save()

        return Response({"message": "Action completed"})    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from .models import AnalyticsEvent, Product, User
from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

# Імпортуємо всі моделі з твого проекту (перевір правильність імпорту під свою структуру папок)
from .models import User, Product, Machine, Conversation, Message, Report, Notification

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

# Імпортуємо ваші моделі
from .models import User, Product, Machine, Conversation, Message, Report, Notification

class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated] # Переконуємось, що юзер авторизований

    def get(self, request):
        today = timezone.now().date()
        
        # 1. Отримуємо поточного адміна та його гуртожиток
        current_admin = request.user
        admin_dorm = getattr(current_admin, 'dormitory', None)
        
        # Якщо у адміна чомусь не вказано гуртожиток, можна або повернути помилку, 
        # або рахувати по всій системі. Зробимо базовий фільтр:
        if not admin_dorm:
            return Response({"error": "Admin has no assigned dormitory."}, status=400)

        # 2. ФІЛЬТРУЄМО КОРИСТУВАЧІВ (тільки з гуртожитку цього адміна)
        users_in_dorm = User.objects.filter(dormitory=admin_dorm)
        total_users = users_in_dorm.count()
        signups_today = users_in_dorm.filter(date_joined__date=today).count()

        # 3. ФІЛЬТРУЄМО ПРАЛЬНІ МАШИНИ
        # УВАГА: Перевірте у вашій моделі Machine, як вона пов'язана з гуртожитком.
        # Якщо у моделі Machine є поле 'dormitory', то фільтр буде такий:
        try:
            dorm_machines = Machine.objects.filter(dormitory=admin_dorm)
        except Exception:
            # Якщо поля 'dormitory' в Machine немає, але є, наприклад, 'dormitory_number' (як у Conversation):
            try:
                dorm_machines = Machine.objects.filter(dormitory_number=admin_dorm)
            except Exception:
                # Якщо зв'язку взагалі немає, поки що беремо всі машинки (тимчасовий захист від помилки)
                dorm_machines = Machine.objects.all()

        total_machines = dorm_machines.count()
        free_machines = dorm_machines.filter(status='free').count()

        # 4. ФІЛЬТРУЄМО ЧАТИ ТА ПОВІДОМЛЕННЯ
        # В admin.py для Conversation було вказано поле 'dormitory_number'. Використовуємо його:
        try:
            dorm_conversations = Conversation.objects.filter(dormitory_number=admin_dorm)
        except Exception:
            # На випадок, якщо поле називається просто 'dormitory'
            dorm_conversations = Conversation.objects.filter(dormitory=admin_dorm)

        total_conversations = dorm_conversations.count()
        
        # Рахуємо повідомлення за сьогодні, які належать ТІЛЬКИ чатам цього гуртожитку
        messages_today = Message.objects.filter(
            conversation__in=dorm_conversations, 
            created_at__date=today
        ).count()

        # 5. ФІЛЬТРУЄМО МАРКЕТПЛЕЙС (Товари, які продають студенти з цього гуртожитку)
        # Продукт пов'язаний з продавцем (seller), а продавець — це User, у якого є гуртожиток
        dorm_products = Product.objects.filter(seller__dormitory=admin_dorm)
        total_listings = Product.objects.count()
        listings_today = Product.objects.filter(created_at__date=today).count()

        # 6. ФІЛЬТРУЄМО СКАРГИ (Скарги, які подали студенти цього гуртожитку)
        pending_reports = Report.objects.filter(reporter__dormitory=admin_dorm, status='pending').count()

        # 7. ФІЛЬТРУЄМО СПОВІЩЕННЯ (Надіслані студентам цього гуртожитку)
        total_notifications = Notification.objects.filter(user__dormitory=admin_dorm).count()

        # Віддаємо відфільтровані дані на фронтенд
        data = {
            "total_users": total_users,
            "signups_today": signups_today,
            "total_listings": total_listings,
            "listings_today": listings_today,
            
            "total_conversations": total_conversations,
            "messages_today": messages_today,
            "active_chats_today": messages_today,
            
            "total_machines": total_machines,
            "free_machines": free_machines,
            
            "pending_reports": pending_reports,
            "total_notifications": total_notifications
        }
        
        return Response(data)
    
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import AnalyticsEvent

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_event_manual(request):
    event_type = request.data.get('event_type')
    if event_type:
        AnalyticsEvent.objects.create(event_type=event_type, user=request.user)
        return Response({"status": "tracked"})
    return Response({"error": "no event type"}, status=400)