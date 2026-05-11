from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .views import (
    CategoryViewSet,
    ProductViewSet,
    OrderViewSet,
    StoreSettingViewSet,
    ReviewViewSet,
    NewsletterSubscriberViewSet,
    CouponViewSet,
    DashboardStatsView,
    CustomerListView,
    ContactMessageViewSet,
    PaystackWebhookView
)

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:5173/login/callback" # Update for production
    client_class = OAuth2Client

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'subscribers', NewsletterSubscriberViewSet)
router.register(r'coupons', CouponViewSet)
router.register(r'settings', StoreSettingViewSet, basename='settings')
router.register(r'contact', ContactMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    
    # Auth
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
    
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('webhooks/paystack/', PaystackWebhookView.as_view(), name='paystack-webhook'),
]
