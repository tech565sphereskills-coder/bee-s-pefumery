import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { ProductImage } from "@/components/shop/product-image";
import { cn } from "@/lib/utils";

interface Product {
  id: number | string;
  slug?: string;
  name: string;
  brand: string;
  price: number | string;
  discount_price?: string;
  stock: number;
  image: string;
  category: number | string;
  category_name?: string;
  description: string;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const ids = useWishlist((s) => s.ids);
  const wished = ids.includes(product.id.toString());

  const moveToCart = () => {
    add(product);
    if (wished) toggle(product.id.toString());
    toast.success(`${product.name} moved to cart`);
  };

  return (
    <div className="group relative">
      <Link to="/shop/$productId" params={{ productId: (product.slug || product.id.toString()) }} className="block">
        <div className="relative overflow-hidden">
          <ProductImage
            src={product.image}
            alt={product.name}
            imgClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-noir/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur text-noir px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest translate-y-4 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 shadow-xl">
              View Details
            </span>
          </div>
          <div className="absolute inset-0 bg-noir/5 opacity-0 transition-opacity group-hover:opacity-100" />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id.toString());
            }}
            aria-label="Add to wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-all hover:bg-gold hover:text-nude"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                wished
                  ? "fill-gold text-gold group-hover:text-nude group-hover:fill-nude"
                  : "text-foreground",
              )}
            />
          </button>
        </div>

        <div className="mt-5 space-y-1">
          <p className="eyebrow text-muted-foreground truncate block">
            {product.category_name || product.category}
          </p>
          <h3 className="font-serif text-lg leading-tight transition-colors group-hover:text-gold line-clamp-2 h-12">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {product.discount_price ? (
              <>
                <span className="text-sm font-semibold text-green-600">
                  ₦{parseFloat(product.discount_price).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  ₦{typeof product.price === "number" ? product.price.toLocaleString() : parseFloat(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                ₦{typeof product.price === "number" ? product.price.toLocaleString() : parseFloat(product.price).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Link>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (wished) {
            moveToCart();
          } else {
            add(product);
            toast.success(`${product.name} added to cart`);
          }
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-foreground py-3 text-[10px] uppercase tracking-[0.25em] transition-all hover:bg-foreground hover:text-background"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        {wished ? "Move to Cart" : "Add to Cart"}
      </motion.button>
    </div>
  );
}
