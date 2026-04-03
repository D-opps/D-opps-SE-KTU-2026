from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api.views import MachineViewSet, ProductViewSet

# 1. Настройка роутера для API
router = DefaultRouter()
router.register(r'machines', MachineViewSet)
router.register(r'products', ProductViewSet)

# 2. Основные пути проекта
urlpatterns = [
    # Админка
    path('admin/', admin.site.urls),
    
    # Все API эндпоинты (продукты, машины и т.д.)
    path('api/', include(router.urls)),
    
    # Если ты добавишь стандартную авторизацию DRF (необязательно, но полезно)
    path('api-auth/', include('rest_framework.urls')),
]

# 3. Раздача медиа-файлов (картинок) в режиме разработки
# Без этого блока картинки в React НЕ БУДУТ отображаться (будет 404)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)