from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Machine, Product
from .serializers import UserSerializer, MachineSerializer, ProductSerializer
import requests

# Отримуємо твою кастомну модель User
User = get_user_model()

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(seller=self.request.user)
        else:
            first_user = User.objects.first()
            serializer.save(seller=first_user)

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
            return Response({"message": "Success"}, status=status.HTTP_201_CREATED)
        except Exception as e:
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