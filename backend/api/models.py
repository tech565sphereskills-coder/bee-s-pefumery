from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/')
    is_active = models.BooleanField(default=True)
    best_seller = models.BooleanField(default=False)
    notes = models.JSONField(default=dict, blank=True, help_text="JSON object for top, heart, and base notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='gallery', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/gallery/')
    alt_text = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Gallery image for {self.product.name}"

class Variant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    size_ml = models.IntegerField(help_text="Size in milliliters (e.g., 30, 50, 100)")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    sku = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'size_ml']
        unique_together = ['product', 'size_ml']

    def __str__(self):
        return f"{self.product.name} - {self.size_ml}ml"

class Review(models.Model):
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s review for {self.product.name}"

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    order_id = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_verified = models.BooleanField(default=False)
    payment_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_id

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(Variant, on_delete=models.SET_NULL, null=True, blank=True)
    variant_label = models.CharField(max_length=20, blank=True, help_text="e.g. 50ml")
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)

class StoreSetting(models.Model):
    store_name = models.CharField(max_length=100, default="Bee's Perfumery")
    contact_email = models.EmailField()
    whatsapp_number = models.CharField(max_length=20)
    delivery_fee_lagos = models.DecimalField(max_digits=12, decimal_places=2, default=2500)
    delivery_fee_others = models.DecimalField(max_digits=12, decimal_places=2, default=5000)
    paystack_public_key = models.CharField(max_length=255, blank=True)
    paystack_secret_key = models.CharField(max_length=255, blank=True)
    cod_enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.store_name

class Coupon(models.Model):
    DISCOUNT_TYPES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()

    def __str__(self):
        return self.code

class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

# Signals to create profile automatically
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
class ContactMessage(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Inquiry from {self.full_name} - {self.subject}"

class AbandonedCart(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, help_text="Client-generated unique token")
    cart_data = models.JSONField(default=list, help_text="Array of cart items")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    full_name = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reminder_1h_sent = models.BooleanField(default=False)
    reminder_24h_sent = models.BooleanField(default=False)
    reminder_72h_sent = models.BooleanField(default=False)
    recovered = models.BooleanField(default=False)
    coupon_code = models.CharField(max_length=50, blank=True, help_text="Recovery coupon attached")

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Abandoned cart for {self.email} ({self.created_at.date()})"


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='wishlist_items')
    session_token = models.CharField(max_length=64, blank=True, help_text="For guest users without an account")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlist_items')
    variant = models.ForeignKey(Variant, on_delete=models.SET_NULL, null=True, blank=True)
    notify_on_stock = models.BooleanField(default=False, help_text="Send email notification when back in stock")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['user', 'product', 'variant'], ['session_token', 'product', 'variant']]

    def __str__(self):
        owner = self.user.email if self.user else self.session_token[:12]
        return f"Wishlist item ({self.product.name}) — {owner}"
