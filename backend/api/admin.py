from django.contrib import admin
from .models import Category, Product, Variant, Order, OrderItem, StoreSetting, AbandonedCart, WishlistItem

class VariantInline(admin.TabularInline):
    model = Variant
    extra = 1
    fields = ['size_ml', 'price', 'stock', 'sku', 'is_active', 'sort_order']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'price', 'stock', 'is_active', 'best_seller')
    list_filter = ('brand', 'is_active', 'best_seller', 'category')
    search_fields = ('name', 'brand')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [VariantInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'full_name', 'total_amount', 'status', 'payment_verified', 'created_at')
    list_filter = ('status', 'payment_verified', 'created_at')
    search_fields = ('order_id', 'full_name', 'email')
    inlines = [OrderItemInline]

@admin.register(StoreSetting)
class StoreSettingAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        # Only allow one instance of settings
        return not StoreSetting.objects.exists()

@admin.register(AbandonedCart)
class AbandonedCartAdmin(admin.ModelAdmin):
    list_display = ('email', 'total', 'created_at', 'reminder_1h_sent', 'reminder_24h_sent', 'reminder_72h_sent', 'recovered')
    list_filter = ('reminder_1h_sent', 'reminder_24h_sent', 'reminder_72h_sent', 'recovered', 'created_at')
    search_fields = ('email', 'full_name', 'coupon_code')
    readonly_fields = ('token', 'created_at', 'updated_at')

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'session_token', 'notify_on_stock', 'created_at')
    list_filter = ('notify_on_stock', 'created_at')
    search_fields = ('product__name', 'user__email', 'session_token')
