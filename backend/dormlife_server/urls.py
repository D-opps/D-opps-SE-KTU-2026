from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# 1. Імпортуємо в'юшки з додатка api
from api.views import (
    GoogleLoginView, MachineViewSet, ProductViewSet, 
    ProfileView, RegisterView, ConversationViewSet, MessageViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# 2. Налаштовуємо роутер
router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')

# 3. Основні шляхи
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Головний блок API
    path('api/', include([
        # Маршрути роутера (api/products/, api/machines/, api/conversations/)
        path('', include(router.urls)),
        
        # Спеціальні ендпоінти для дашборду (тепер вони будуть api/metrics/...)
        path('metrics/', ConversationViewSet.as_view({'get': 'metrics'})),
        path('recent_messages/', ConversationViewSet.as_view({'get': 'recent_messages'})),
        
        # Авторизація та профіль
        path('register/', RegisterView.as_view(), name='register'),
        path('profile/', ProfileView.as_view(), name='profile'),
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
        
        # Скидання пароля
        path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    ])),
    
    # Авторизація для інтерфейсу DRF (браузерна версія)
    path('api-auth/', include('rest_framework.urls')),
]

# 4. Раздача медіа-файлів
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)