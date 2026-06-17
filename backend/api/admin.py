from django.contrib import admin
from .models import Category, Product, Variant, Order, OrderItem, StoreSetting

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
