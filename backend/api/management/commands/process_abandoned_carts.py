from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from api.models import AbandonedCart, Coupon
import json


def send_cart_email(cart, template_num, coupon_code=None):
    item_lines = []
    for item in cart.cart_data:
        name = item.get('name', 'Item')
        qty = item.get('qty', 1)
        price = float(item.get('price', 0))
        variant = item.get('variant')
        label = f" ({variant.get('label', '')})" if variant else ""
        item_lines.append(f"  • {name}{label} x{qty} — ₦{price * qty:,.2f}")

    items_text = "\n".join(item_lines) if item_lines else "  (items unavailable)"
    total = float(cart.total)

    subject_map = {
        1: "Still thinking about your Bee's Perfumery order?",
        24: "Your cart at Bee's Perfumery is waiting ✨",
        72: "We saved your selection — plus a little something for you 🎁",
    }

    intro_map = {
        1: f"Hi{ ' ' + cart.full_name if cart.full_name else '' },\n\nYou added some fragrances to your cart but didn't complete your order. We wanted to make sure nothing stopped you from finding your perfect scent.",
        24: f"Hi{ ' ' + cart.full_name if cart.full_name else '' },\n\nYour cart is still waiting for you! These exclusive fragrances are selling fast, and we wouldn't want you to miss out.",
        72: f"Hi{ ' ' + cart.full_name if cart.full_name else '' },\n\nIt's been a while — we've kept your selection safe. As a thank you for your patience, here's an exclusive discount to help you decide:",
    }

    coupon_text = ""
    if coupon_code:
        coupon_text = f"\n\n🎁 Use code **{coupon_code}** at checkout for a special discount!"

    message = f"""{intro_map.get(template_num, '')}

Here's what's in your cart:
{items_text}

Order Total: ₦{total:,.2f}
{coupon_text}

👉 Complete your order: https://bees-perfumery.pages.dev/checkout

Need help choosing? Reply to this email or WhatsApp us — we'd love to help you find your signature scent.

With love,
Bee's Perfumery 🐝
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background: #fbfbf9; margin: 0; padding: 20px; color: #0a0a0a; }}
    .card {{ max-width: 560px; background: #fff; border: 1px solid #e5e5e0; margin: 0 auto; padding: 40px; }}
    .logo {{ text-align: center; border-bottom: 1px solid #f0f0e8; padding-bottom: 25px; margin-bottom: 30px; }}
    .logo h1 {{ font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; color: #0a0a0a; margin: 0; }}
    .logo p {{ font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: #a1a19a; margin: 2px 0 0; }}
    .items {{ margin: 20px 0; }}
    .item {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f0; font-size: 13px; }}
    .total {{ font-size: 16px; font-weight: bold; color: #d4af37; text-align: right; margin: 20px 0; }}
    .coupon {{ background: #fcf8f3; border: 1px solid #f0e8d0; padding: 16px; text-align: center; margin: 20px 0; border-radius: 4px; }}
    .coupon code {{ font-size: 18px; font-weight: bold; color: #8a0373; letter-spacing: 0.1em; }}
    .btn {{ display: inline-block; background: #0a0a0a; color: #fff !important; text-decoration: none; padding: 14px 28px; font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; margin: 20px 0; text-align: center; }}
    .footer {{ text-align: center; font-size: 11px; color: #a1a19a; margin-top: 30px; border-top: 1px solid #f0f0e8; padding-top: 20px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>Bee's</h1>
      <p>Perfumery</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6;">
      {intro_map.get(template_num, '')}
    </p>

    <div class="items">
      {"".join(f'<div class="item"><span>{item.get("name", "Item")}{" (" + item.get("variant", {}).get("label", "") + ")" if item.get("variant") else ""} x{item.get("qty", 1)}</span><span>₦{float(item.get("price", 0)) * int(item.get("qty", 1)):,.2f}</span></div>' for item in cart.cart_data)}
    </div>

    <div class="total">Total: ₦{total:,.2f}</div>

    {"".join(f'<div class="coupon"><p style="font-size: 12px; color: #666; margin-bottom: 8px;">Your exclusive discount code</p><code>{coupon_code}</code></div>' for _ in [1] if coupon_code)}

    <div style="text-align: center;">
      <a href="https://bees-perfumery.pages.dev/checkout" class="btn">Complete Your Order</a>
    </div>

    <div class="footer">
      <p>&copy; {timezone.now().year} Bee's Perfumery. All rights reserved.</p>
      <p>Luxury Fragrance Concierge — Lagos, Nigeria</p>
    </div>
  </div>
</body>
</html>
"""

    send_mail(
        subject_map.get(template_num, "Your Bee's Perfumery cart is waiting"),
        message,
        settings.DEFAULT_FROM_EMAIL,
        [cart.email],
        fail_silently=True,
        html_message=html_content,
    )


def generate_coupon(cart):
    """Create a 10% off coupon for the 72h reminder."""
    code = f"WELCOME{cart.id}{timezone.now().strftime('%y%m')}"
    Coupon.objects.update_or_create(
        code=code,
        defaults={
            'discount_type': 'percentage',
            'amount': 10,
            'active': True,
            'valid_until': timezone.now() + timedelta(days=14),
        },
    )
    return code


class Command(BaseCommand):
    help = "Process abandoned carts and send reminder emails"

    def handle(self, *args, **options):
        now = timezone.now()

        # Reminder 1: sent 1 hour after creation, not already sent
        one_hour_ago = now - timedelta(hours=1)
        carts_1h = AbandonedCart.objects.filter(
            created_at__lte=one_hour_ago,
            reminder_1h_sent=False,
            recovered=False,
        )
        for cart in carts_1h:
            send_cart_email(cart, 1)
            cart.reminder_1h_sent = True
            cart.save(update_fields=['reminder_1h_sent'])
            self.stdout.write(f"  1h reminder sent to {cart.email}")

        # Reminder 2: sent 24 hours after creation
        twenty_four_hours_ago = now - timedelta(hours=24)
        carts_24h = AbandonedCart.objects.filter(
            created_at__lte=twenty_four_hours_ago,
            reminder_1h_sent=True,
            reminder_24h_sent=False,
            recovered=False,
        )
        for cart in carts_24h:
            send_cart_email(cart, 24)
            cart.reminder_24h_sent = True
            cart.save(update_fields=['reminder_24h_sent'])
            self.stdout.write(f"  24h reminder sent to {cart.email}")

        # Reminder 3: sent 72 hours after creation, includes coupon
        seventy_two_hours_ago = now - timedelta(hours=72)
        carts_72h = AbandonedCart.objects.filter(
            created_at__lte=seventy_two_hours_ago,
            reminder_24h_sent=True,
            reminder_72h_sent=False,
            recovered=False,
        )
        for cart in carts_72h:
            coupon_code = generate_coupon(cart)
            send_cart_email(cart, 72, coupon_code=coupon_code)
            cart.reminder_72h_sent = True
            cart.coupon_code = coupon_code
            cart.save(update_fields=['reminder_72h_sent', 'coupon_code'])
            self.stdout.write(f"  72h reminder sent to {cart.email} (coupon: {coupon_code})")

        self.stdout.write(self.style.SUCCESS(
            f"Processed {carts_1h.count()} 1h, {carts_24h.count()} 24h, {carts_72h.count()} 72h reminders"
        ))
