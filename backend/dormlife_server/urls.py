from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Імпортуємо модуль views цілком, щоб працював views.get_me
from api import views 
from api.views import (
    CreateReportView, GoogleLoginView, MachineViewSet, ReportViewSet, NotificationViewSet, ProductViewSet, 
    ProfileView, RegisterView, ConversationViewSet, MessageViewSet, EventViewSet, ReportViewSet, DashboardMetricsView, track_event_manual
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'events', EventViewSet, basename='events')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reports', ReportViewSet, basename='report')
urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include([
        path('', include(router.urls)),

        path('admin/metrics/', DashboardMetricsView.as_view(), name='admin-metrics'),
        path('analytics/track/', track_event_manual),

        path('recent_messages/', ConversationViewSet.as_view({'get': 'recent_messages'})),

        path('register/', RegisterView.as_view()),
        path('profile/', ProfileView.as_view()),

        path('token/', TokenObtainPairView.as_view()),
        path('token/refresh/', TokenRefreshView.as_view()),

        path('auth/google/', GoogleLoginView.as_view()),

        path('users/me/', views.get_me),
        path('users/search/', views.search_user_by_email),

        path('password_reset/', include('django_rest_passwordreset.urls')),

       ])),
    
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)