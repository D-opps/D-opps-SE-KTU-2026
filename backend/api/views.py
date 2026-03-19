from rest_framework import viewsets, permissions
from .models import User, Machine, Product
from .serializers import UserSerializer, MachineSerializer, ProductSerializer

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Якщо юзер залогінений, він стає продавцем
        if self.request.user.is_authenticated:
            serializer.save(seller=self.request.user)
        else:
            # Тимчасово для тестів, якщо немає логіну
            first_user = User.objects.first()
            serializer.save(seller=first_user)