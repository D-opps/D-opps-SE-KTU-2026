from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Імпортуємо модуль views цілком, щоб працював views.get_me
from api import views 
from api.views import (
    GoogleLoginView, MachineViewSet, ProductViewSet, 
    ProfileView, RegisterView, ConversationViewSet, MessageViewSet, EventViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'events', EventViewSet, basename='events')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include([
        path('', include(router.urls)),
        
        # Спеціальні ендпоінти
        path('metrics/', ConversationViewSet.as_view({'get': 'metrics'})),
        path('recent_messages/', ConversationViewSet.as_view({'get': 'recent_messages'})),
        
        path('register/', RegisterView.as_view(), name='register'),
        path('profile/', ProfileView.as_view(), name='profile'),
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
        
        path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
        
        # ВИПРАВЛЕНО: Прибираємо "views." з назви, якщо функція імпортована напряму, 
        # АБО використовуємо views.get_me, якщо імпортували 'from api import views'
        path('users/me/', views.get_me),
        path('users/search/', views.search_user_by_email),
    ])),
    
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)