from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse

# Імпортуємо всі потрібні в'юшки
from api.views import (
    GoogleLoginView, 
    MachineViewSet, 
    ProductViewSet, 
    RegisterView, 
    UserProfileView,
    ConversationViewSet,  # Додай цей імпорт!
    MessageViewSet,  # Додай цей імпорт!
    AdminDashboardView,  # Додай цей імпорт!
    LatestProductsView,  # Додай цей імпорт!
    RecentMessagesView  # Додай цей імпорт!
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
def unread_count_stub(request):
    return JsonResponse({'count': 0})

def notifications_stub(request):
    return JsonResponse([], safe=False)
# Створюємо ОДИН роутер і реєструємо всі в'юсети
router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'products', ProductViewSet)
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include([
        # Всі маршрути роутера (products, machines, conversations)
        path('', include(router.urls)),
        
        # Реєстрація та Профіль
        path('register/', RegisterView.as_view(), name='register'),
        path('profile/', UserProfileView.as_view(), name='profile'),
        
        # Логін та Токени
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        
        # Скидання пароля
        path('password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
        
        # Google Auth
        path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
        path('admin/metrics/', AdminDashboardView.as_view(), name='admin-metrics'),
        path('chat/unread-count/', unread_count_stub, name='unread-count'),
        path('notifications/', notifications_stub, name='notifications'),
        path('metrics/', AdminDashboardView.as_view(), name='admin-metrics'),
        path('products/latest/', LatestProductsView.as_view(), name='latest-products'),
        path('messages/recent/', RecentMessagesView.as_view(), name='recent-messages'),

        ])),
    
    path('api-auth/', include('rest_framework.urls')),
]

# Роздача медіа та статики (для фото товарів)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)