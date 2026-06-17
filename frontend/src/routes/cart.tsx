import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCart, cartSubtotal } from "@/store/cart";
import { naira } from "@/data/products";
import { ProductImage } from "@/components/shop/product-image";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Bee's Perfumery" },
      { name: "description", content: "Review your selected fragrances." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = cartSubtotal(items);

  if (items.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5">
        <div className="text-center">
          <p className="eyebrow text-gold">Your Cart</p>
          <h1 className="mt-6 font-serif text-5xl">A blank canvas.</h1>
          <p className="mt-4 text-muted-foreground">Your cart is currently empty.</p>
          <Link
            to="/shop"
            className="mt-10 inline-block border border-foreground px-10 py-4 eyebrow hover:bg-foreground hover:text-background transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="text-center">
          <p className="eyebrow text-gold">Cart</p>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl">Your Selection</h1>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item, idx) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="flex gap-5 py-8"
              >
                <Link
                  to="/shop/$productId"
                  params={{ productId: item.id }}
                  className="block w-24 shrink-0 md:w-32"
                >
                  <ProductImage src={item.image} alt={item.name} aspect="aspect-square" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to="/shop/$productId"
                        params={{ productId: item.id }}
                        className="font-serif text-xl hover:text-gold"
                      >
                        {item.name}
                      </Link>
                      {item.variant && (
                        <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
                          {item.variant.label}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">{naira(item.price)}</p>
                    </div>
                    <button
                      onClick={() => {
                        remove(item.id);
                        toast(`${item.name} removed`);
                      }}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-foreground/30">
                      <button onClick={() => setQty(item.id, item.qty - 1)} className="px-3 py-2">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.qty}</span>
                      <button onClick={() => setQty(item.id, item.qty + 1)} className="px-3 py-2">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-serif text-lg">{naira(item.qty * item.price)}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border bg-secondary/30 p-8">
              <p className="eyebrow text-gold">Order Summary</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{naira(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="text-muted-foreground">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="my-6 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Total</span>
                <span className="font-serif text-3xl">{naira(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-8 block w-full bg-foreground py-4 text-center eyebrow text-background hover:bg-gold hover:text-nude transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/shop"
                className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
