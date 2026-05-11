import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Minus, Plus, Star, Truck, ShieldCheck, Share2, 
  MessageCircle, ChevronDown, Info, Sparkles, Droplets 
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { naira } from "@/data/products";
import { useCart, useWishlist } from "@/store/cart";
import { ProductCard } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/shop/$productId")({
  loader: async ({ params }) => {
    try {
      const res = await api.get(`/products/${params.productId}/`);
      return { product: res.data };
    } catch (err) {
      console.error("Failed to fetch product", err);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Bee's Perfumery` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — Bee's Perfumery` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
          { name: "twitter:image", content: loaderData.product.image },
        ]
      : [],
  }),
  pendingComponent: () => <ProductDetailSkeleton />,
  component: ProductDetail,
});

function ProductDetailSkeleton() {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-16">
        <Skeleton className="h-4 w-48 mb-10" />
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-noir/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 group"
      >
        <span className="eyebrow text-xs group-hover:text-gold transition-colors">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pb-6 text-sm text-muted-foreground leading-relaxed font-light"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<any[]>([]);
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const ids = useWishlist((s) => s.ids);
  const wished = ids.includes(product.id.toString());

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await api.get(`/products/${product.slug}/related/`);
        setRelated(res.data);
      } catch (err) {
        // Fallback if action doesn't exist yet or fails
        const res = await api.get("/products/", { params: { category: product.category, limit: 5 } });
        setRelated((res.data.results || res.data).filter((p: any) => p.id !== product.id).slice(0, 4));
      }
    };
    fetchRelated();
  }, [product.id, product.slug, product.category]);

  const gallery = product.gallery?.length > 0 ? product.gallery.map((g: any) => g.image) : [product.image];

  const handleAdd = () => {
    add(product, qty);
    toast.success(`${product.name} added to cart`, { description: `Quantity: ${qty}` });
  };

  const handleBuyNow = () => {
    add(product, qty);
    navigate({ to: "/checkout" });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, text: product.description, url: window.location.href });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} at Bee's Perfumery: ${window.location.href}`)}`, "_blank");
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Announcement */}
      <div className="bg-secondary/30 py-3 text-center border-b border-noir/5">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gold animate-pulse">
          Complimentary Luxury Samples with Every Order
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        <nav className="eyebrow mb-8 text-muted-foreground flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-noir font-medium truncate max-w-[150px]">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_450px] lg:gap-20 text-left">
          {/* Gallery Column */}
          <div className="space-y-6">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group/gallery aspect-[4/5] rounded-[2rem] overflow-hidden bg-secondary/20 shadow-2xl"
            >
              <ProductImage src={gallery[active]} alt={product.name} aspect="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/20 to-transparent opacity-0 group-hover/gallery:opacity-100 transition-opacity" />
              <button 
                onClick={handleShare}
                className="absolute top-6 right-6 h-12 w-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center text-noir shadow-xl opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-gold hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </motion.div>
            
            <div className="grid grid-cols-4 gap-4">
              {gallery.map((g: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden transition-all duration-500",
                    active === i ? "ring-2 ring-gold ring-offset-4 ring-offset-background scale-95" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <ProductImage src={g} alt="" aspect="h-full w-full" />
                </button>
              ))}
            </div>

            {/* Professional Stats Overlay (Desktop only) */}
            <div className="hidden lg:grid grid-cols-3 gap-6 pt-10 border-t border-noir/5">
              <div className="text-center p-6 rounded-3xl bg-secondary/20 border border-noir/5">
                <Sparkles className="h-5 w-5 text-gold mx-auto mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-noir mb-1">Sillage</p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map(v => <div key={v} className={cn("h-1 w-3 rounded-full", v <= 4 ? "bg-gold" : "bg-noir/10")} />)}
                </div>
              </div>
              <div className="text-center p-6 rounded-3xl bg-secondary/20 border border-noir/5">
                <Droplets className="h-5 w-5 text-gold mx-auto mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-noir mb-1">Longevity</p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map(v => <div key={v} className={cn("h-1 w-3 rounded-full", v <= 5 ? "bg-gold" : "bg-noir/10")} />)}
                </div>
              </div>
              <div className="text-center p-6 rounded-3xl bg-secondary/20 border border-noir/5">
                <Info className="h-5 w-5 text-gold mx-auto mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-noir mb-1">Season</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">All Year</p>
              </div>
            </div>
          </div>

          {/* Info Column */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="eyebrow text-gold text-xs tracking-[0.2em]">{product.brand}</p>
                  <div className="flex gap-0.5 text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < 5 ? "fill-gold" : "")} />
                    ))}
                  </div>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl leading-tight text-noir">{product.name}</h1>
                <p className="mt-4 text-3xl font-serif text-gold">{naira(product.price)}</p>
              </div>

              <div className="p-6 bg-secondary/30 rounded-2xl border border-gold/10 italic font-serif text-lg leading-relaxed text-noir/80">
                &ldquo;{product.description}&rdquo;
              </div>

              {/* Olfactory Notes Grid */}
              <div className="grid grid-cols-1 gap-4">
                <Accordion title="Olfactory Composition">
                  <div className="grid grid-cols-3 gap-4 text-center mt-4">
                    {(["top", "heart", "base"] as const).map((tier) => (
                      <div key={tier}>
                        <p className="font-serif italic text-noir mb-2 capitalize">{tier}</p>
                        <ul className="space-y-1 text-[11px]">
                          {product.notes?.[tier]?.map((n: string) => (
                            <li key={n} className="text-muted-foreground">{n}</li>
                          )) || <li>None</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="How to Wear">
                  Apply to pulse points: wrists, inner elbows, and the base of the throat. Avoid rubbing as it breaks down fragrance molecules. For extended longevity, apply after a luxury unscented moisturizer.
                </Accordion>
                <Accordion title="Delivery & Concierge">
                  Complimentary nationwide delivery on orders over ₦100,000. Each fragrance arrives in our signature velvet-lined box with a matching discovery sample. Returns accepted within 7 days in original sealed packaging.
                </Accordion>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-2xl border border-noir/5">
                <div className={cn("h-2 w-2 rounded-full animate-pulse", product.stock > 0 ? "bg-green-500" : "bg-red-500")} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-noir">
                  {product.stock > 0 ? `${product.stock} Exclusive Bottles Available` : "Currently Sold Out"}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-noir text-white rounded-2xl overflow-hidden h-14">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-5 hover:bg-white/10 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="px-5 hover:bg-white/10 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggle(product.id.toString())}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl border-2 transition-all font-bold text-[10px] uppercase tracking-widest",
                      wished ? "bg-gold border-gold text-white" : "border-noir/10 hover:border-gold hover:text-gold"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", wished ? "fill-white" : "")} />
                    {wished ? "In Wishlist" : "Wishlist"}
                  </button>
                </div>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full bg-gold py-5 rounded-2xl eyebrow text-white hover:bg-noir transition-all shadow-2xl shadow-gold/20 disabled:opacity-50 h-16 flex items-center justify-center gap-3"
                >
                  Proceed to Checkout <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 pt-6">
                <div className="text-center">
                  <ShieldCheck className="h-5 w-5 text-gold mx-auto mb-2" />
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Genuine</p>
                </div>
                <div className="text-center">
                  <Truck className="h-5 w-5 text-gold mx-auto mb-2" />
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Secure</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="h-5 w-5 text-gold mx-auto mb-2" />
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-32">
          <div className="flex items-end justify-between mb-16 border-b border-noir/5 pb-8">
            <div>
              <p className="eyebrow text-gold mb-2">The Experience</p>
              <h2 className="font-serif text-4xl">Client Testimonials</h2>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-3xl font-serif">5.0</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Elite Rating</p>
            </div>
          </div>
          
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {product.reviews?.length > 0 ? (
              product.reviews.map((r: any, i: number) => (
                <div key={i} className="group relative">
                  <div className="absolute -top-4 -left-4 h-12 w-12 bg-secondary rounded-full flex items-center justify-center text-gold font-serif text-2xl italic opacity-20">
                    &ldquo;
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex gap-0.5 text-gold">
                      {[...Array(5)].map((_, k) => <Star key={k} className={cn("h-2.5 w-2.5", k < r.rating ? "fill-gold" : "text-noir/10")} />)}
                    </div>
                    <p className="font-serif italic text-lg leading-relaxed text-noir group-hover:text-gold transition-colors">
                      {r.comment}
                    </p>
                    <p className="eyebrow text-[10px] text-muted-foreground uppercase">{r.user_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-secondary/10 rounded-[3rem] border border-dashed border-noir/10">
                <p className="text-muted-foreground italic font-serif text-xl">
                  Become the first to share the story of this scent.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-32 pt-16 border-t border-noir/5">
            <h2 className="font-serif text-4xl text-center mb-16 text-noir">Discover More from {product.brand}</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
