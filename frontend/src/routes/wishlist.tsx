import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { products, naira } from "@/data/products";
import { useCart, useWishlist } from "@/store/cart";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Bee's Perfumery" },
      { name: "description", content: "Fragrances you've saved for later." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const ids = useWishlist((s) => s.ids);
  const toggle = useWishlist((s) => s.toggle);
  const add = useCart((s) => s.add);

  const items = products.filter((p) => ids.includes(p.id));

  if (items.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5 text-center">
        <div>
          <Heart className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-6 text-gold">Wishlist</p>
          <h1 className="mt-4 font-serif text-5xl">Nothing saved yet.</h1>
          <p className="mt-4 text-muted-foreground">
            Tap the heart on any fragrance to keep it for later.
          </p>
          <Link
            to="/shop"
            className="mt-10 inline-block border border-foreground px-10 py-4 eyebrow hover:bg-foreground hover:text-background transition-colors"
          >
            Browse Fragrances
          </Link>
        </div>
      </div>
    );
  }

  const moveAll = () => {
    items.forEach((p) => add(p, 1));
    items.forEach((p) => toggle(p.id));
    toast.success("Wishlist moved to cart");
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="text-center">
          <p className="eyebrow text-gold">Saved For Later</p>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl">Your Wishlist</h1>
          <div className="gold-divider mx-auto mt-8" />
        </div>

        <div className="mt-12 flex justify-end">
          <button
            onClick={moveAll}
            className="border border-foreground px-6 py-3 eyebrow hover:bg-foreground hover:text-background transition-colors"
          >
            Move all to cart
          </button>
        </div>

        <ul className="mt-8 divide-y divide-border border-y border-border">
          {items.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center"
            >
              <Link
                to="/shop/$productId"
                params={{ productId: p.id }}
                className="block w-full sm:w-32 shrink-0 bg-secondary"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="aspect-[4/5] sm:aspect-square w-full object-cover"
                />
              </Link>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-muted-foreground">{p.brand}</p>
                  <Link
                    to="/shop/$productId"
                    params={{ productId: p.id }}
                    className="mt-2 block font-serif text-2xl hover:text-gold"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">{naira(p.price)}</p>
                </div>
                <button
                  onClick={() => toggle(p.id)}
                  aria-label="Remove"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-3 sm:flex-col sm:gap-2">
                <button
                  onClick={() => {
                    add(p, 1);
                    toggle(p.id);
                    toast.success(`${p.name} moved to cart`);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 eyebrow text-background hover:bg-gold hover:text-nude transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Move to Cart
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
