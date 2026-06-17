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
            if category.isdigit():
                queryset = queryset.filter(category__id=category)
            else:
                queryset = queryset.filter(category__slug__iexact=category)
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

    def perform_create(self, serializer):
        from .models import ProductImage
        product = serializer.save()
        
        # Handle new gallery images
        gallery_images = self.request.FILES.getlist('gallery_images')
        for img in gallery_images:
            ProductImage.objects.create(product=product, image=img)

    def perform_update(self, serializer):
        from .models import ProductImage
        product = serializer.save()
        
        # Handle new gallery images
        gallery_images = self.request.FILES.getlist('gallery_images')
        for img in gallery_images:
            ProductImage.objects.create(product=product, image=img)
            
        # Handle deleted gallery images
        deleted_ids = self.request.data.get('deleted_gallery_images')
        if deleted_ids:
            import json
            try:
                if isinstance(deleted_ids, str):
                    deleted_ids = json.loads(deleted_ids)
            except Exception:
                if isinstance(deleted_ids, str):
                    deleted_ids = [int(id.strip()) for id in deleted_ids.split(',') if id.strip().isdigit()]
            
            if isinstance(deleted_ids, list):
                ProductImage.objects.filter(product=product, id__in=deleted_ids).delete()

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

    def get_permissions(self):
        if self.action in ['create', 'track', 'verify_payment']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Order.objects.none()
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
        if self.request.user and self.request.user.is_authenticated:
            order = serializer.save(user=self.request.user)
        else:
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
        from django.db.models import Sum
        User = get_user_model()
        
        customers = {}
        
        # 1. Process all orders (both guest and registered)
        orders = Order.objects.all().order_by('created_at')
        for order in orders:
            email = order.email.strip().lower() if order.email else ""
            if not email:
                continue
                
            if email not in customers:
                customers[email] = {
                    "id": f"CUS-G{order.id:03d}",
                    "name": order.full_name or "Guest Customer",
                    "email": order.email,
                    "phone": order.phone or "N/A",
                    "orders": 0,
                    "total": 0.0,
                    "date_joined": order.created_at,
                    "is_registered": False
                }
            
            customers[email]["orders"] += 1
            if order.payment_verified or order.status == 'paid':
                customers[email]["total"] += float(order.total_amount)
            
            # Keep the most complete contact info
            if order.full_name and len(order.full_name) > len(customers[email]["name"]):
                customers[email]["name"] = order.full_name
            if order.phone and customers[email]["phone"] == "N/A":
                customers[email]["phone"] = order.phone
                
        # 2. Process and merge registered users
        users = User.objects.filter(is_staff=False).order_by('-date_joined')
        for user in users:
            email = user.email.strip().lower() if user.email else ""
            if not email:
                continue
                
            phone = "N/A"
            if hasattr(user, 'profile') and getattr(user.profile, 'phone_number', ''):
                phone = user.profile.phone_number
                
            name = f"{user.first_name} {user.last_name}".strip() if user.first_name else user.username
            
            if email in customers:
                customers[email]["id"] = f"CUS-{user.id:03d}"
                customers[email]["is_registered"] = True
                customers[email]["name"] = name or customers[email]["name"]
                if phone != "N/A":
                    customers[email]["phone"] = phone
                if user.date_joined < customers[email]["date_joined"]:
                    customers[email]["date_joined"] = user.date_joined
            else:
                customers[email] = {
                    "id": f"CUS-{user.id:03d}",
                    "name": name or "Registered User",
                    "email": user.email,
                    "phone": phone,
                    "orders": 0,
                    "total": 0.0,
                    "date_joined": user.date_joined,
                    "is_registered": True
                }
                
        customer_list = list(customers.values())
        customer_list.sort(key=lambda x: x["date_joined"], reverse=True)
        
        return Response(customer_list)

def send_order_email(order):
    """Send order confirmation email to customer and admin."""
    subject = f"Order Confirmation - {order.order_id}"
    
    # Text fallback
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
    
    # Premium HTML Email template
    year = timezone.now().year
    formatted_address = order.address.replace('\n', '<br>')
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FBFBF9; margin: 0; padding: 20px; color: #0A0A0A; }}
    .card {{ max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e0; margin: 0 auto; padding: 40px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }}
    .header {{ text-align: center; border-bottom: 1px solid #f0f0e8; padding-bottom: 25px; margin-bottom: 30px; }}
    .logo-main {{ font-family: 'Georgia', serif; font-size: 26px; letter-spacing: 0.15em; text-transform: uppercase; color: #0A0A0A; margin: 0; }}
    .logo-sub {{ font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: #a1a19a; margin: 2px 0 0 0; }}
    .title {{ font-family: 'Georgia', serif; font-size: 18px; color: #D4AF37; margin-top: 0; text-align: center; letter-spacing: 0.15em; text-transform: uppercase; }}
    .greeting {{ font-size: 14px; line-height: 1.6; color: #0a0a0a; margin-bottom: 20px; }}
    .details-table {{ width: 100%; border-collapse: collapse; margin: 25px 0; }}
    .details-table th, .details-table td {{ text-align: left; padding: 12px; border-bottom: 1px solid #f5f5f0; font-size: 13px; }}
    .details-table th {{ background-color: #fafaf7; color: #8a8a80; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }}
    .total-row {{ font-size: 15px; font-weight: bold; color: #D4AF37; }}
    .address-box {{ background-color: #fcfcf9; border: 1px solid #f0f0e8; padding: 20px; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #5a5a54; margin: 25px 0; }}
    .footer {{ text-align: center; font-size: 11px; color: #a1a19a; margin-top: 40px; border-top: 1px solid #f0f0e8; padding-top: 20px; letter-spacing: 0.05em; }}
    .btn {{ display: inline-block; background-color: #0A0A0A; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; margin: 20px auto; text-align: center; border-radius: 2px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="logo-main">Bee's</h1>
      <p class="logo-sub">Perfumery</p>
    </div>
    
    <h2 class="title">Order Confirmation</h2>
    
    <p class="greeting">Hello {order.full_name},</p>
    <p class="greeting">Thank you for your order at Bee's Perfumery. We are preparing your exquisite fragrance selection for shipment and will notify you as soon as it departs.</p>
    
    <table class="details-table">
      <thead>
        <tr>
          <th>Detail</th>
          <th>Information</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Order Reference</td>
          <td style="font-family: monospace; font-size: 14px;"><strong>{order.order_id}</strong></td>
        </tr>
        <tr>
          <td>Fulfillment Status</td>
          <td style="text-transform: capitalize;">{order.get_status_display()}</td>
        </tr>
        <tr class="total-row">
          <td>Total Amount</td>
          <td>₦{order.total_amount:,.2f}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="address-box">
      <strong style="color: #0A0A0A; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Delivery Details</strong>
      {formatted_address}
    </div>
    
    <div style="text-align: center;">
      <a href="http://localhost:5174/track?ref={order.order_id}" class="btn" style="color: #ffffff !important;">Track Your Order</a>
    </div>
    
    <div class="footer">
      <p>&copy; {year} Bee's Perfumery. All rights reserved.</p>
      <p>Luxury Fragrance Concierge &bull; Lagos, Nigeria</p>
    </div>
  </div>
</body>
</html>
"""

    try:
        # To Customer
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [order.email],
            fail_silently=True,
            html_message=html_content
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
