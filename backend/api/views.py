from rest_framework import viewsets, permissions, status
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
import hmac
import hashlib
import json
import os
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Category, Product, Order, OrderItem, StoreSetting, Review, Coupon, NewsletterSubscriber, ContactMessage
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    OrderSerializer, 
    OrderItemSerializer, 
    StoreSettingSerializer,
    ReviewSerializer,
    NewsletterSubscriberSerializer,
    CouponSerializer,
    ContactMessageSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('gallery', 'reviews')
    serializer_class = ProductSerializer
    lookup_field = 'slug'

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        
        try:
            return super().get_object()
        except:
            # Fallback to ID if slug not found
            try:
                return queryset.get(pk=self.kwargs[lookup_url_kwarg])
            except:
                from django.http import Http404
                raise Http404

    def get_queryset(self):
        queryset = Product.objects.all().prefetch_related('gallery', 'reviews')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        best_seller = self.request.query_params.get('best_seller')

        if category:
            queryset = queryset.filter(category__id=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(brand__icontains=search) |
                Q(description__icontains=search)
            )
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if best_seller:
            queryset = queryset.filter(best_seller=best_seller.lower() == 'true')
        
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        product = self.get_object()
        related_products = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]
        serializer = self.get_serializer(related_products, many=True)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def track(self, request):
        order_id = request.data.get('order_id')
        email = request.data.get('email')
        if not order_id or not email:
            return Response({"error": "Order ID and Email required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = Order.objects.get(order_id__iexact=order_id, email__iexact=email)
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        order = serializer.save()
        if order.status == 'paid' or order.payment_verified:
            send_order_email(order)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def verify_payment(self, request):
        reference = request.data.get('reference')
        if not reference:
            return Response({"error": "Reference required"}, status=status.HTTP_400_BAD_REQUEST)
        
        import requests
        setting = StoreSetting.objects.get(id=1)
        secret_key = setting.paystack_secret_key
        
        url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
        }
        
        try:
            res = requests.get(url, headers=headers)
            res_data = res.json()
            
            if res_data['status'] and res_data['data']['status'] == 'success':
                # Payment successful, update or create order if needed
                # For simplicity, we just return the data here
                return Response(res_data)
            else:
                return Response(res_data, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoreSettingViewSet(viewsets.ModelViewSet):
    queryset = StoreSetting.objects.all()
    serializer_class = StoreSettingSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        # Always return the first store setting object
        obj, created = StoreSetting.objects.get_or_create(id=1)
        return obj

class CustomerListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.filter(is_staff=False).order_by('-date_joined')
        
        data = []
        for user in users:
            total_spent = Order.objects.filter(user=user, payment_verified=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            order_count = Order.objects.filter(user=user).count()
            data.append({
                "id": f"CUS-{user.id:03d}",
                "name": f"{user.first_name} {user.last_name}" if user.first_name else user.username,
                "email": user.email,
                "phone": getattr(user.profile, 'phone_number', 'N/A'),
                "orders": order_count,
                "total": float(total_spent),
                "date_joined": user.date_joined
            })
        
        return Response(data)

def send_order_email(order):
    """Send order confirmation email to customer and admin."""
    subject = f"Order Confirmation - {order.order_id}"
    message = f"""
    Hello {order.full_name},
    
    Thank you for your order at Bee's Perfumery!
    
    Order ID: {order.order_id}
    Total Amount: ₦{order.total_amount:,.2f}
    Status: {order.get_status_display()}
    
    Delivery Address:
    {order.address}
    
    We will notify you once your order has been shipped.
    """
    try:
        # To Customer
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [order.email],
            fail_silently=True,
        )
        # To Admin (Inquiry/Alert)
        send_mail(
            f"New Order Received: {order.order_id}",
            f"A new order has been placed by {order.full_name} ({order.email}). Amount: ₦{order.total_amount:,.2f}",
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else [],
            fail_silently=True,
        )
    except:
        pass

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)
        
        total_revenue = Order.objects.filter(payment_verified=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_orders = Order.objects.count()
        total_products = Product.objects.count()
        low_stock_count = Product.objects.filter(stock__lt=10).count()
        recent_orders = Order.objects.all().order_by('-created_at')[:5]
        
        # Aggregate daily revenue for last 7 days
        sales_data = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            revenue = Order.objects.filter(
                payment_verified=True, 
                created_at__date=date.date()
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            sales_data.append({
                "name": date.strftime('%a'),
                "sales": float(revenue)
            })

        # Real data fetching
        low_stock_items = Product.objects.filter(stock__lt=10, is_active=True).order_by('stock')[:5]
        top_products = Product.objects.filter(is_active=True).order_by('-price')[:5]
        
        data = {
            "totalRevenue": float(total_revenue),
            "totalOrders": total_orders,
            "totalProducts": total_products,
            "lowStock": low_stock_count,
            "revenueGrowth": 12.5,
            "orderGrowth": 8.2,
            "recentOrders": OrderSerializer(recent_orders, many=True).data,
            "lowStockItems": ProductSerializer(low_stock_items, many=True).data,
            "topProducts": ProductSerializer(top_products, many=True).data,
            "salesData": sales_data
        }
        
        return Response(data)

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by('-valid_from')
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]

class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all().order_by('-subscribed_at')
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        message = serializer.save()
        # Notify Admin
        try:
            send_mail(
                f"New Contact Inquiry: {message.subject}",
                f"From: {message.full_name} ({message.email})\n\nMessage:\n{message.message}",
                settings.DEFAULT_FROM_EMAIL,
                [settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else [],
                fail_silently=True,
            )
        except:
            pass

class PaystackWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        payload = request.body
        signature = request.headers.get('x-paystack-signature')
        
        if not signature:
            return Response({"error": "Signature missing"}, status=status.HTTP_400_BAD_REQUEST)

        # Get secret key from environment or database
        secret = os.getenv('PAYSTACK_SECRET_KEY')
        if not secret:
            try:
                setting = StoreSetting.objects.get(id=1)
                secret = setting.paystack_secret_key
            except StoreSetting.DoesNotExist:
                pass

        if not secret:
            return Response({"error": "Secret key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        computed_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()

        if computed_signature != signature:
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = json.loads(payload)
            event = data.get('event')

            if event == 'charge.success':
                reference = data['data']['reference']
                # Search for order by reference or order_id
                order = Order.objects.filter(
                    models.Q(payment_reference=reference) | 
                    models.Q(order_id=reference)
                ).first()
                
                if order:
                    already_verified = order.payment_verified
                    order.payment_verified = True
                    order.status = 'paid'
                    order.save()
                    
                    if not already_verified:
                        send_order_email(order)
            
            return Response({"status": "success"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
