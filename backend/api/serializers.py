from rest_framework import serializers
from .models import Category, Product, Variant, Order, OrderItem, StoreSetting, ProductImage, Review, NewsletterSubscriber, Coupon, ContactMessage
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']

class VariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Variant
        fields = ['id', 'size_ml', 'price', 'stock', 'sku', 'is_active', 'sort_order']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    gallery = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 5.0
        return sum([r.rating for r in reviews]) / len(reviews)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_min_price(self, obj):
        active = obj.variants.filter(is_active=True)
        if active.exists():
            return float(active.order_by('price').first().price)
        return float(obj.price)

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    variant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = '__all__'

    def get_variant_name(self, obj):
        if obj.variant:
            return f"{obj.variant.size_ml}ml"
        return obj.variant_label or ""

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Order
        fields = '__all__'

    def create(self, validated_data):
        items_data = self.initial_data.get('items', [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            product_id = item_data.get('product')
            quantity = item_data.get('quantity', 1)
            price = item_data.get('price')
            variant_id = item_data.get('variant_id')
            variant_label = item_data.get('variant_label', '')
            try:
                product = Product.objects.get(id=product_id)
                variant = None
                if variant_id:
                    try:
                        variant = Variant.objects.get(id=variant_id)
                    except Variant.DoesNotExist:
                        pass
                if not variant_label and variant:
                    variant_label = f"{variant.size_ml}ml"
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant,
                    variant_label=variant_label,
                    quantity=quantity,
                    price=price or (variant.price if variant else product.price)
                )
            except Product.DoesNotExist:
                pass
        return order

class StoreSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSetting
        fields = '__all__'

class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = '__all__'

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

class CustomLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)


    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            from django.contrib.auth import authenticate
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs

from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    phone_number = serializers.CharField(max_length=20, required=False)
    first_name = serializers.CharField(max_length=150, required=False)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['phone_number'] = self.validated_data.get('phone_number', '')
        data['first_name'] = self.validated_data.get('first_name', '')
        return data

    def custom_signup(self, request, user):
        first_name = self.validated_data.get('first_name')
        if first_name:
            user.first_name = first_name
            user.save()

        phone_number = self.validated_data.get('phone_number')
        if phone_number:
            user.profile.phone_number = phone_number
            user.profile.save()
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
