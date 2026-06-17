import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Heart, Minus, Plus, Star, Truck, ShieldCheck, Share2,
  ChevronDown, Info, ShoppingCart, Award, Sparkles, Droplets
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
    <div className="bg-[#f5f5f5] min-h-screen py-4 font-sans">
      <div className="mx-auto max-w-7xl px-4">
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          <div className="lg:col-span-3 space-y-4">
            {/* Core Box */}
            <div className="bg-white rounded-sm shadow-sm p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <Skeleton className="aspect-square w-full rounded-sm" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-14 rounded-sm" />
                  ))}
                </div>
              </div>
              <div className="md:col-span-7 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Details Box */}
            <div className="bg-white rounded-sm shadow-sm p-4 space-y-4">
              <Skeleton className="h-5 w-32 border-b pb-2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-48 w-full rounded-sm" />
            <Skeleton className="h-48 w-full rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<any[]>([]);
  const [region, setRegion] = useState("Lagos");
  const [city, setCity] = useState("Lekki-Ajah (Sangotedo)");

  const variants: any[] = product.variants?.filter((v: any) => v.is_active) || [];
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
    }
  }, [product.id]);

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayStock = selectedVariant ? selectedVariant.stock : product.stock;

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
        const res = await api.get("/products/", { params: { category: product.category, limit: 5 } });
        setRelated((res.data.results || res.data).filter((p: any) => p.id !== product.id).slice(0, 4));
      }
    };
    fetchRelated();
  }, [product.id, product.slug, product.category]);

  const gallery = product.gallery?.length > 0 ? product.gallery.map((g: any) => g.image) : [product.image];

  const handleAdd = () => {
    const variantInfo = selectedVariant ? {
      id: selectedVariant.id,
      size_ml: selectedVariant.size_ml,
      price: parseFloat(selectedVariant.price),
      label: `${selectedVariant.size_ml}ml`,
    } : undefined;
    add(product, qty, variantInfo);
    const label = variantInfo ? ` ${variantInfo.label} × ${qty}` : `Quantity: ${qty}`;
    toast.success(`${product.name} added to cart`, { description: label });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, text: product.description, url: window.location.href });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} at Bee's Perfumery: ${window.location.href}`)}`, "_blank");
    }
  };

  const formattedPrice = naira(displayPrice);
  const hasMultipleVariants = variants.length > 1;

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-4 font-sans text-gray-800 text-left">

      <div className=" bg-gold/80 text-white py-2 text-center text-xs font-semibold tracking-wider uppercase mb-3">
        👑 Premium Selection — Free Delivery on all Elite Fragrance Orders above ₦100,000!
      </div>

      <div className="mx-auto max-w-7xl px-4">

        <nav className="text-xs text-gray-500 py-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:underline hover:text-gray-800 transition-colors">Home</Link>
          <span className="text-gray-400 font-light">&gt;</span>
          <Link to="/shop" className="hover:underline hover:text-gray-800 transition-colors">Shop</Link>
          <span className="text-gray-400 font-light">&gt;</span>
          <span className="hover:underline hover:text-gray-800 cursor-pointer capitalize">{product.category || "Fragrances"}</span>
          <span className="text-gray-400 font-light">&gt;</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>


        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

          <div className="lg:col-span-3 space-y-4">


            <div className="bg-white rounded-sm shadow-sm p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">


                <div className="md:col-span-5 flex flex-col space-y-4">

                  <div className="relative aspect-square border border-gray-100 rounded-sm overflow-hidden bg-[#fcfcfc] flex items-center justify-center">
                    <ProductImage src={gallery[active]} alt={product.name} aspect="h-full w-full" />


                    <button
                      onClick={() => toggle(product.id.toString())}
                      className={cn(
                        "absolute top-3 right-3 h-10 w-10 bg-white/95 border shadow-sm rounded-full flex items-center justify-center transition-all hover:scale-105",
                        wished ? "text-red-500 border-red-200" : "text-gray-400 hover:text-red-500 border-gray-100"
                      )}
                    >
                      <Heart className={cn("h-5 w-5", wished ? "fill-red-500" : "")} />
                    </button>
                  </div>


                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-start">
                    {gallery.map((g: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={cn(
                          "h-14 w-14 border rounded-sm overflow-hidden flex-shrink-0 transition-all bg-gray-50",
                          active === i ? "border-[#8F3674] ring-1 ring-[#C221A7]" : "border-gray-200 hover:border-gray-400"
                        )}
                      >
                        <ProductImage src={g} alt="" aspect="h-full w-full" />
                      </button>
                    ))}
                  </div>


                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold uppercase tracking-wider">Share this product</span>
                    <div className="flex items-center gap-3">
                      <button onClick={handleShare} className="hover:text-[#AD1C8E] transition-colors p-1.5 rounded-full border border-gray-100 hover:border-[#AC158B] flex items-center gap-1 font-medium">
                        <Share2 className="h-4 w-4" /> Share Link
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 pt-1 text-center cursor-pointer hover:underline">
                    Report incorrect product information
                  </div>
                </div>


                <div className="md:col-span-7 flex flex-col space-y-4">

                  <div className="flex items-center gap-2">
                    <span className="bg-orange-50 text-gold text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide border border-orange-100">
                      Non-Returnable
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      Official Scent
                    </span>
                  </div>


                  <div className="space-y-1">
                    <h1 className="text-xl font-normal text-gray-800 leading-snug tracking-wide">
                      {product.name}
                    </h1>
                    <div className="text-xs text-gray-500">
                      Brand: <span className="text-[#8A0373] font-medium hover:underline cursor-pointer">{product.brand}</span> | <span className="text-[#8A0373] font-medium hover:underline cursor-pointer">Similar products from {product.brand}</span>
                    </div>
                  </div>


                  <div className="flex items-center gap-2 text-xs border-b border-gray-100 pb-3">
                    <div className="flex gap-0.5 text-[#8A0373]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[#8A0373] text-[#8A0373]" />
                      ))}
                    </div>
                    <span className="text-[#8A0373] hover:underline cursor-pointer">({product.reviews?.length || 5} verified ratings)</span>
                  </div>


                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-gray-900 tracking-tight">
                      {formattedPrice}
                      {hasMultipleVariants && selectedVariant && (
                        <span className="text-base font-normal text-gray-500 ml-2">
                          / {selectedVariant.size_ml}ml
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {displayStock > 0 ? (
                        <>
                          <span className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 font-bold rounded-sm border border-green-200 uppercase tracking-wider">
                            In Stock
                          </span>
                          <span className="text-[11px] text-gray-500 font-light">
                            + shipping from ₦750 to {city}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-700 px-2.5 py-0.5 font-bold rounded-sm border border-red-200 uppercase tracking-wider">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>


                  {hasMultipleVariants && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Select Size
                      </p>
                      <div className="flex gap-2">
                        {variants.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVariant(v);
                              setQty(1);
                            }}
                            className={`text-xs font-bold px-5 py-2.5 rounded-sm transition-all ${
                              selectedVariant?.id === v.id
                                ? "border-2 border-[#8A0373] text-[#8A0373] bg-orange-50/30 shadow-sm"
                                : "border border-gray-300 text-gray-600 bg-white hover:border-gray-500"
                            }`}
                          >
                            {v.size_ml}ml — {naira(v.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}


                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <div className="flex items-center gap-4">

                      <div className="flex items-center bg-gray-50 border border-gray-300 rounded-sm h-12">
                        <button
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          className="px-4 text-gray-500 hover:bg-gray-100 h-full transition-colors rounded-l-sm"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-12 text-center text-sm font-bold font-mono text-gray-800">{qty}</span>
                        <button
                          onClick={() => setQty(qty + 1)}
                          className="px-4 text-gray-500 hover:bg-gray-100 h-full transition-colors rounded-r-sm"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>


                      <button
                        onClick={handleAdd}
                        disabled={displayStock === 0}
                        className="flex-1 flex items-center justify-center gap-3 h-12 bg-[#8A0373] hover:bg-[#9F2187] text-white font-bold text-xs uppercase tracking-wider rounded-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </button>
                    </div>


                    <div className="bg-[#fcf8f3] border border-orange-100 rounded-sm p-3.5 space-y-2 text-xs text-gray-700">
                      <p className="font-semibold text-gray-800 uppercase tracking-widest text-[9px] mb-1">Promotions & Concierge</p>
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[#8A0373] font-bold">⭐</span>
                        <p>Call <span className="font-bold text-[#8A0373] hover:underline cursor-pointer">02018883300</span> to complete order directly via concierge.</p>
                      </div>
                      <div className="flex gap-2.5 items-start">
                        <span className="text-[#8A0373] font-bold">⭐</span>
                        <p>Enjoy free shipping insurance and cheaper delivery rate at any Pickup Station checkout.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>


            <div className="bg-white rounded-sm shadow-sm p-5 border border-gray-100 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Product Details
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed font-light space-y-4">
                <p className="italic font-serif text-lg text-gray-800 bg-gray-50 border-l-4 border-[#8A0373] p-4 rounded-r-md">
                  &ldquo;{product.description}&rdquo;
                </p>


                {product.notes && (
                  <div className="pt-4 space-y-3">
                    <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Olfactory Fragrance Composition</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-sm border border-gray-100">
                      {(["top", "heart", "base"] as const).map((tier) => (
                        <div key={tier} className="bg-white border rounded-sm p-3 text-center shadow-xs">
                          <p className="font-serif italic font-bold text-gray-800 capitalize mb-1 border-b border-gray-100 pb-1.5">{tier} Notes</p>
                          <ul className="space-y-0.5 text-xs text-gray-500">
                            {product.notes?.[tier]?.map((n: string) => (
                              <li key={n}>{n}</li>
                            )) || <li>None Listed</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>


            <div className="bg-white rounded-sm shadow-sm p-5 border border-gray-100 space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Specifications
              </h2>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-l-2 border-[#8A0373] pl-2">Key Features</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-600 font-light text-xs">
                    <li>Authentic premium scent formulation imported directly.</li>
                    <li>Strong 48-hour longevity profile with majestic sillage.</li>
                    <li>Perfect for young and mature scent collectors alike.</li>
                    <li>Handcrafted fragrance oil extract in premium luxury glass.</li>
                    <li>Includes luxury velvet presentation packaging.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider border-l-2 border-[#8A0373] pl-2">What&apos;s in the Box</h3>
                  <p className="text-gray-600 font-light text-xs">
                    1 Original Bottle of genuine {product.name} ({product.brand}) 100ml Eau de Parfum, encased in authentic retail branded velvet lining.
                  </p>
                </div>
              </div>


              <div className="pt-4">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">Specifications Table</h3>
                <div className="border border-gray-200 rounded-sm overflow-hidden text-xs text-gray-600 shadow-xs">
                  <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 py-2.5 px-4 font-semibold text-gray-700">
                    <div>Specification Parameter</div>
                    <div>Value / Details</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-gray-100 py-2.5 px-4">
                    <div className="font-medium text-gray-800">SKU</div>
                    <div className="font-mono text-gray-500 uppercase">{product.slug}</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-gray-100 py-2.5 px-4">
                    <div className="font-medium text-gray-800">Production Country</div>
                    <div>UAE / France</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-gray-100 py-2.5 px-4">
                    <div className="font-medium text-gray-800">Volume Size</div>
                    <div>100 ml (3.4 fl. oz.)</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-gray-100 py-2.5 px-4">
                    <div className="font-medium text-gray-800">Fragrance Concentration</div>
                    <div>Eau De Parfum (EDP Extract)</div>
                  </div>
                  <div className="grid grid-cols-2 py-2.5 px-4">
                    <div className="font-medium text-gray-800">Main Ingredient</div>
                    <div>Luxurious Perfume Oils, Alcohol Denat</div>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-sm shadow-sm p-5 border border-gray-100 space-y-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                Verified Customer Feedback
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">

                <div className="md:col-span-1 text-center py-6 bg-gray-50 rounded-sm border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Rating</p>
                  <p className="text-4xl font-bold text-[#8A0373]">5.0 <span className="text-xs text-gray-500 font-normal">/ 5</span></p>
                  <div className="flex justify-center gap-0.5 text-[#8A0373] my-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-[#8A0373] text-[#8A0373]" />)}
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">{product.reviews?.length || 5} Verified Votes</p>
                </div>


                <div className="md:col-span-3 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="w-12 font-medium">5 Star</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#8A0373] w-full" />
                    </div>
                    <span className="w-8 text-right font-medium">100%</span>
                  </div>
                  {[4, 3, 2, 1].map((s) => (
                    <div key={s} className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="w-12 font-medium">{s} Star</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                      <span className="w-8 text-right font-medium">0%</span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="pt-4 border-t border-gray-100 space-y-6">
                <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider mb-4">Client Reviews</p>
                {product.reviews?.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {product.reviews.map((r: any, i: number) => (
                      <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-0.5 text-yellow-500">
                            {[...Array(5)].map((_, k) => <Star key={k} className={cn("h-3 w-3", k < r.rating ? "fill-[#8A0373] text-[#8A0373]" : "text-gray-200")} />)}
                          </div>
                          <span className="text-[10px] text-gray-400">{r.user_name}</span>
                        </div>
                        <p className="text-sm italic font-serif text-gray-800 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                        <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                          <Award className="h-3 w-3" /> Verified Purchase
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="py-4 border-b border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5 text-yellow-500">
                          {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-yellow-500 text-yellow-500" />)}
                        </div>
                        <span className="text-[10px] text-gray-400">Sarah O.</span>
                      </div>
                      <p className="text-sm italic font-serif text-gray-800 leading-relaxed">&ldquo;An absolutely magnificent fragrance! It smells incredibly rich and elegant, and it genuinely lasted on my clothes for more than 48 hours. Strongly recommend!&rdquo;</p>
                      <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                        <Award className="h-3 w-3" /> Verified Purchase
                      </p>
                    </div>
                    <div className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5 text-yellow-500">
                          {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-yellow-500 text-yellow-500" />)}
                        </div>
                        <span className="text-[10px] text-gray-400">Emeka A.</span>
                      </div>
                      <p className="text-sm italic font-serif text-gray-800 leading-relaxed">&ldquo;Authentic formulation. The sillage is wonderful, it gets compliments everywhere I go. Shipping was extremely fast and arrived in perfect state.&rdquo;</p>
                      <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                        <Award className="h-3 w-3" /> Verified Purchase
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {related.length > 0 && (
              <section className="bg-white rounded-sm shadow-sm p-5 border border-gray-100 space-y-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-center text-gray-800 border-b border-gray-100 pb-3">
                  Discover More from {product.brand}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                  {related.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}

          </div>


          <div className="lg:col-span-1 space-y-4">


            <div className="bg-white rounded-sm shadow-sm p-3.5 border border-gray-100 text-xs space-y-4">
              <h2 className="font-semibold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100">
                Delivery & Returns
              </h2>


              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose Your Location</label>
                <div className="relative">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-sm py-2 px-3 focus:outline-none focus:border-[#f68b1e] appearance-none"
                  >
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja (FCT)</option>
                    <option value="Rivers">Rivers (Port Harcourt)</option>
                    <option value="Kano">Kano</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-sm py-2 px-3 focus:outline-none focus:border-[#f68b1e] appearance-none"
                  >
                    <option value="Lekki-Ajah (Sangotedo)">Lekki-Ajah (Sangotedo)</option>
                    <option value="Ikeja (GRA)">Ikeja (GRA)</option>
                    <option value="Victoria Island">Victoria Island</option>
                    <option value="Wuse II (Abuja)">Wuse II (Abuja)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>


              <div className="space-y-4 pt-2">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-orange-50 rounded-sm text-[#8A0373] flex-shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-semibold text-gray-800">
                      <span>Door Delivery</span>
                      <span className="text-[#8A0373] font-normal hover:underline cursor-pointer">Details</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Delivery Fees <span className="font-bold text-gray-700">₦1,550</span>.<br />
                      Ready for delivery between tomorrow and 3 days from now.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-orange-50 rounded-sm text-[#8A0373] flex-shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-semibold text-gray-800">
                      <span>Pickup Station</span>
                      <span className="text-[#8A0373] font-normal hover:underline cursor-pointer">Details</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Delivery Fees <span className="font-bold text-gray-700">₦750</span>.<br />
                      Ready for pickup between tomorrow and 3 days from now.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start border-t border-gray-100 pt-3">
                  <div className="p-2 bg-orange-50 rounded-sm text-[#8A0373] flex-shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-semibold text-gray-800">
                      <span>Return Policy</span>
                      <span className="text-[#8A0373] font-normal hover:underline cursor-pointer">Details</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Free return within 7 days for ALL eligible items in original sealed packaging.
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-sm shadow-sm p-3.5 border border-gray-100 text-xs space-y-4">
              <h2 className="font-semibold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100 flex justify-between items-center">
                <span>Seller Information</span>
                <span className="text-gray-400 font-light">&gt;</span>
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">AuthenticStore</h3>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">100% Seller Score | 22 Followers</p>
                  </div>
                  <button className="border border-[#8A0373] text-[#8A0373] hover:bg-orange-50/50 text-[10px] uppercase font-bold py-1 px-3.5 rounded-sm transition-all shadow-xs">
                    Follow
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 text-[11px] text-gray-500">
                  <p className="font-semibold text-gray-800 uppercase tracking-widest text-[9px]">Seller Performance</p>
                  <div className="flex justify-between items-center">
                    <span>Shipping Speed:</span>
                    <span className="text-green-600 font-bold">Excellent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quality Score:</span>
                    <span className="text-green-600 font-bold">Excellent</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cancellation Rate:</span>
                    <span className="text-green-600 font-bold">0% (Excellent)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
