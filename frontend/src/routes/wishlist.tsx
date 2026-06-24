import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, X, Bell, BellOff, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { naira } from "@/data/products";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

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
  const items = useWishlist((s) => s.items);
  const ids = useWishlist((s) => s.ids);
  const loaded = useWishlist((s) => s.loaded);
  const init = useWishlist((s) => s.init);
  const toggle = useWishlist((s) => s.toggle);
  const setNotify = useWishlist((s) => s.setNotify);
  const removeItem = useWishlist((s) => s.removeItem);
  const add = useCart((s) => s.add);

  useEffect(() => {
    if (!loaded) init();
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Wishlist link copied"),
      () => toast.error("Could not copy link"),
    );
  };

  const handleNotifyToggle = (item: typeof items[0]) => {
    setNotify(item.id, !item.notify_on_stock);
    toast.success(item.notify_on_stock ? "Stock alert disabled" : "We'll notify you when back in stock");
  };

  if (!loaded) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Heart className="h-8 w-8 animate-pulse text-gold" />
      </div>
    );
  }

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

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="eyebrow text-gold">Saved For Later</p>
            <h1 className="mt-4 font-serif text-5xl md:text-6xl">Your Wishlist</h1>
            <div className="gold-divider mt-8" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="border border-foreground px-5 py-3 eyebrow hover:bg-foreground hover:text-background transition-colors flex items-center gap-2"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>

        <ul className="mt-8 divide-y divide-border border-y border-border">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center"
            >
              <Link
                to="/shop/$productId"
                params={{ productId: String(item.product) }}
                className="block w-full sm:w-32 shrink-0 bg-secondary"
              >
                <img
                  src={item.product_image || "/placeholder.svg"}
                  alt={item.product_name}
                  className="aspect-[4/5] sm:aspect-square w-full object-cover"
                />
              </Link>
              <div className="flex flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-muted-foreground">{item.product_brand}</p>
                  <Link
                    to="/shop/$productId"
                    params={{ productId: String(item.product) }}
                    className="mt-2 block font-serif text-2xl hover:text-gold truncate"
                  >
                    {item.product_name}
                    {item.variant_name ? <span className="text-base text-muted-foreground ml-2">({item.variant_name})</span> : null}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {naira(Number(item.product_price))}
                    {!item.in_stock && <span className="ml-2 text-red-500 text-xs">Out of Stock</span>}
                  </p>
                </div>
                <button
                  onClick={() => { toggle(String(item.product)); removeItem(item.id); }}
                  aria-label="Remove"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2 sm:flex-col sm:gap-2 shrink-0">
                {!item.in_stock && (
                  <button
                    onClick={() => handleNotifyToggle(item)}
                    className="inline-flex items-center justify-center gap-2 border border-foreground px-4 py-3 eyebrow text-xs hover:bg-foreground hover:text-background transition-colors"
                    title={item.notify_on_stock ? "Disable stock alert" : "Notify me when back in stock"}
                  >
                    {item.notify_on_stock ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    {item.notify_on_stock ? "Alert On" : "Notify"}
                  </button>
                )}
                <button
                  onClick={async () => {
                    add({ id: item.product, name: item.product_name, price: Number(item.product_price), image: item.product_image || "", brand: item.product_brand, slug: item.product_slug } as any, 1);
                    await toggle(String(item.product));
                    removeItem(item.id);
                    toast.success(`${item.product_name} moved to cart`);
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
