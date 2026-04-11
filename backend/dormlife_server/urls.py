from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Імпортуємо в'юшки
from api.views import GoogleLoginView, MachineViewSet, ProductViewSet, RegisterView

# Імпорти для JWT (логіну)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# 1. Налаштування роутера для ViewSets
router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'products', ProductViewSet)

# 2. Основні шляхи
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Головний блок API
    path('api/', include([
        # Маршрути роутера (products, machines)
        path('', include(router.urls)),
        
        # Реєстрація
        path('register/', RegisterView.as_view(), name='register'),
        
        # Логін (отримання токена)
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        
        # Скидання пароля (потрібно встановити django-rest-passwordreset)
        path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
        
        # Google Auth (заготовка, потребує налаштування GoogleLogin у views.py)
        # path('auth/google/', GoogleLogin.as_view(), name='google_login'),
        path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
        path('api/auth/google/', GoogleLoginView.as_view(), name='google_login'),
    ])),
    
    # Авторизація для інтерфейсу DRF
    path('api-auth/', include('rest_framework.urls')),
]

# 3. Раздача медіа-файлів
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)