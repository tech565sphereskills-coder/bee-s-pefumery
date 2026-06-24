import { useEffect, useMemo, useState, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import api from "@/lib/api";
import { ProductCard } from "@/components/shop/product-card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

interface Variant {
  id: number;
  size_ml: number;
  price: string;
  stock: number;
  sku: string;
  is_active: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  discount_price?: string;
  stock: number;
  image: string;
  is_active: boolean;
  category: number;
  category_name?: string;
  variants?: Variant[];
}

const searchSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Shop Fragrances — Bee's Perfumery" },
      {
        name: "description",
        content:
          "Browse the complete collection of luxury perfumes from Bee's Perfumery. Filter by category, brand and price.",
      },
      { property: "og:title", content: "Shop — Bee's Perfumery" },
      { property: "og:description", content: "Explore the full Bee's Perfumery collection." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const navigate = useNavigate({ from: "/shop" });
  const sp = Route.useSearch();
  const [price, setPrice] = useState<[number, number]>([0, 10000000]);
  const [query, setQuery] = useState(sp.q ?? "");
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        const data = res.data.results || res.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(
    async (isLoadMore = false) => {
      if (!isLoadMore) setLoading(true);
      try {
        const url = isLoadMore && nextPage ? nextPage : "/products/";
        const params = !isLoadMore
          ? {
              category: sp.category,
              brand: sp.brand,
              search: sp.q,
            }
          : {};

        const res = await api.get(url, { params });

        const results = res.data.results || [];
        if (isLoadMore) {
          setProductsList((prev) => [...prev, ...results]);
        } else {
          setProductsList(results);
        }
        setNextPage(res.data.next);
        setTotalCount(res.data.count);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    },
    [nextPage, sp.brand, sp.category, sp.q],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      navigate({ search: { ...sp, q: query || undefined } });
    }, 500);

    return () => clearTimeout(handler);
  }, [query, navigate, sp]);

  useEffect(() => {
    fetchProducts();
  }, [sp.category, sp.brand, sp.q, fetchProducts]);

  const maxPriceLimit = useMemo(() => {
    if (productsList.length === 0) return 10000000;
    const maxVal = Math.max(...productsList.map((p) => parseFloat(p.price) || 0));
    return Math.max(10000000, Math.ceil(maxVal / 100000) * 100000);
  }, [productsList]);

  useEffect(() => {
    setPrice((prev) => {
      if (prev[1] < maxPriceLimit) {
        return [prev[0], maxPriceLimit];
      }
      return prev;
    });
  }, [maxPriceLimit]);

  const filtered = useMemo(() => {
    const result = [...productsList].filter((p) => {
      if (parseFloat(p.price) < price[0] || parseFloat(p.price) > price[1]) return false;
      if (!p.is_active) return false;
      return true;
    });
    if (sp.sort === "price-asc") result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sp.sort === "price-desc") result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return result;
  }, [sp, price, productsList]);

  const dynamicBrands = useMemo(() => {
    const b = new Set(productsList.map((p) => p.brand));
    return Array.from(b).sort();
  }, [productsList]);

  const setCategory = (c?: string) => navigate({ search: { ...sp, category: c as any } });
  const setBrand = (b?: string) => navigate({ search: { ...sp, brand: b } });

  const Filters = () => (
    <div className="space-y-10">
      <div>
        <p className="eyebrow text-gold">Category</p>
        <div className="mt-5 space-y-2 text-sm text-left">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                const val = String(c.id);
                setCategory(sp.category === val || sp.category === c.slug ? undefined : val);
              }}
              className={`block capitalize text-left ${
                sp.category === String(c.id) || sp.category === c.slug
                  ? "text-gold font-medium"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow text-gold">Brand</p>
        <div className="mt-5 space-y-2 text-sm">
          {dynamicBrands.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(sp.brand === b ? undefined : b)}
              className={`block ${sp.brand === b ? "text-gold" : "text-foreground/70 hover:text-foreground text-left w-full"}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow text-gold">Price</p>
        <div className="mt-6 px-1">
          <Slider
            value={price}
            onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
            min={0}
            max={maxPriceLimit}
            step={25000}
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>₦{price[0].toLocaleString()}</span>
            <span>₦{price[1].toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24 text-center">
          <p className="eyebrow text-gold">The Collection</p>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl">Fragrances</h1>
          <div className="gold-divider mx-auto mt-8" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-20">
        <div className="mb-12 flex flex-wrap items-center gap-4 border-b border-border pb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: { ...sp, q: query } });
            }}
            className="flex flex-1 items-center gap-2 border-b border-foreground/30 py-2"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fragrances"
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
          <select
            value={sp.sort ?? "newest"}
            onChange={(e) =>
              navigate({
                search: {
                  ...sp,
                  sort: e.target.value as "newest" | "price-asc" | "price-desc",
                },
              })
            }
            className="border border-border bg-background px-4 py-2 text-xs uppercase tracking-widest"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low — High</option>
            <option value="price-desc">Price: High — Low</option>
          </select>
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest">
              <SlidersHorizontal className="h-3 w-3" /> Filters
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8 px-4">
                <Filters />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-16 text-left">
          <aside className="hidden md:block">
            <Filters />
          </aside>

          <div>
            {loading && productsList.length === 0 ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-32 text-center">
                <p className="font-serif text-2xl">No fragrances match your search.</p>
                <button
                  onClick={() => {
                    navigate({ search: {} });
                    setQuery("");
                    setPrice([0, maxPriceLimit]);
                  }}
                  className="mt-6 eyebrow text-gold hover:text-foreground"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <p className="mb-8 text-sm text-muted-foreground">{filtered.length} fragrances</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>

                {nextPage && (
                  <div className="mt-16 flex justify-center">
                    <button
                      onClick={() => fetchProducts(true)}
                      className="bg-noir text-nude px-10 py-4 font-bold tracking-widest uppercase hover:bg-gold hover:text-noir transition-all"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
