import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  Hourglass,
  Phone,
  Clock,
  MapPin,
} from "lucide-react";
import {
  useOrders,
  STATUS_STEPS,
  computeLiveStatus,
  type Order,
  type OrderStatus,
} from "@/store/orders";
import { naira } from "@/data/products";
import api from "@/lib/api";
import { toast } from "sonner";

const searchSchema = z.object({ ref: z.string().optional() }).catch({});

export const Route = createFileRoute("/track")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Track Your Order — Bee's Perfumery" },
      {
        name: "description",
        content:
          "Track the status of your fragrance order using your order reference or phone number.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { ref: presetRef } = Route.useSearch();
  const findByRef = useOrders((s) => s.findByRef);
  const findByPhone = useOrders((s) => s.findByPhone);

  const [mode, setMode] = useState<"ref" | "phone">("ref");
  const [query, setQuery] = useState(presetRef || "");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      if (mode === "ref") {
        // We now need email to track via API for security
        if (!email.trim()) {
          toast.error("Please enter your email to track");
          setLoading(false);
          return;
        }
        const res = await api.post("orders/track/", { order_id: query, email });
        // Map backend order to frontend Order type if necessary
        const o = res.data;
        const mapped: Order = {
          reference: o.order_id,
          createdAt: new Date(o.created_at).getTime(),
          email: o.email,
          phone: o.phone,
          fullName: o.full_name,
          address: o.address,
          city: "", // Backend combined them
          state: "",
          items: o.items.map(
            (i: { product_name: string; quantity: number; price: number; product: number }) => ({
              id: i.product.toString(),
              name: i.product_name,
              qty: i.quantity,
              price: i.price,
              image: "",
            }),
          ),
          subtotal: Number(o.total_amount), // Simplified for now
          shipping: 0,
          total: Number(o.total_amount),
          status: o.status,
          paymentRef: o.payment_reference,
          etaDays: [3, 5],
        };
        setResults([mapped]);
      } else {
        setResults(findByPhone(query));
      }
    } catch (err: unknown) {
      setResults([]);
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  // auto-search if ref provided in URL
  useEffect(() => {
    if (presetRef) {
      setMode("ref");
      setQuery(presetRef);
      const o = findByRef(presetRef);
      setResults(o ? [o] : []);
      setSearched(true);
    }
  }, [presetRef, findByRef]);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-5 py-12 md:px-10 md:py-20">
        <div className="text-center">
          <p className="eyebrow text-gold">Order Tracking</p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Where is my parcel?</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Enter your order reference or the phone number you used at checkout.
          </p>
        </div>

        <div className="mt-10 inline-flex w-full justify-center">
          <div className="inline-flex border border-border bg-secondary/40 p-1">
            {(["ref", "phone"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setSearched(false);
                }}
                className={`px-5 py-2 eyebrow transition-colors ${mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "ref" ? "Order Reference" : "Phone Number"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex gap-3">
          <div className="flex flex-1 items-center gap-3 border-b border-foreground/30 py-2 focus-within:border-gold">
            {mode === "ref" ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Phone className="h-4 w-4 text-muted-foreground" />
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "ref" ? "BEE-XXXXXX-XXXX" : "+234 ..."}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {mode === "ref" && (
            <div className="flex flex-1 items-center gap-3 border-b border-foreground/30 py-2 focus-within:border-gold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-foreground px-6 py-3 eyebrow text-background hover:bg-gold transition-colors disabled:opacity-50"
          >
            {loading ? (
              "..."
            ) : (
              <>
                <Search className="h-3.5 w-3.5" /> Track
              </>
            )}
          </button>
        </form>

        {searched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 border border-dashed border-border p-10 text-center"
          >
            <Hourglass className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-4 font-serif text-xl">No order found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Double-check the {mode === "ref" ? "reference" : "phone number"} or contact us via
              WhatsApp for help.
            </p>
          </motion.div>
        )}

        {results.length > 0 && (
          <div className="mt-12 space-y-8">
            {results.map((o) => (
              <OrderCard key={o.reference} order={o} />
            ))}
          </div>
        )}

        {!searched && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/profile" className="text-gold hover:underline">
              View your orders →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  // Auto-tick every 30s so the timeline progresses live without a refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const live = useMemo(() => computeLiveStatus(order), [order /* re-computed on tick via state */]);
  const stepIndex = live.stepIndex;
  const progressPct = Math.round(live.progress * 100);
  const arrival = etaWindow(order.createdAt, order.etaDays);
  const isDelivered = stepIndex === STATUS_STEPS.length - 1;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border bg-card p-6 md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-gold">Reference</p>
          <p className="mt-1 font-mono text-sm">{order.reference}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Placed{" "}
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="eyebrow text-gold">Total</p>
          <p className="mt-1 font-serif text-2xl">{naira(order.total)}</p>
          <span
            className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase ${isDelivered ? "bg-gold text-nude" : "bg-secondary text-foreground"}`}
          >
            {isDelivered ? "Delivered" : "In transit"}
          </span>
        </div>
      </div>

      {/* Live timeline */}
      <div className="mt-10">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-3.5 right-3.5 top-3.5 h-px bg-border" />
          <motion.div
            className="absolute left-3.5 top-3.5 h-px bg-gold"
            initial={{ width: 0 }}
            animate={{
              width: `calc(${(stepIndex / (STATUS_STEPS.length - 1)) * 100}% - ${(stepIndex / (STATUS_STEPS.length - 1)) * 28}px)`,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          {STATUS_STEPS.map((s, i) => {
            const reached = i <= stepIndex;
            const current = i === stepIndex && !isDelivered;
            const Icon =
              s.key === "delivered" ? CheckCircle2 : s.key === "shipped" ? Truck : Package;
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center">
                <span
                  className={`relative grid h-7 w-7 place-items-center rounded-full border transition-colors ${
                    reached
                      ? "border-gold bg-gold text-nude"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {current && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-gold"
                      animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                </span>
                <span
                  className={`mt-2 max-w-20 text-center text-[10px] tracking-[0.2em] uppercase ${reached ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ETA progress block */}
      <div className="mt-10 border border-border bg-secondary/40 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gold" />
            <span className="font-serif text-base">
              {isDelivered ? "Arrived" : "Estimated arrival"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-gold">{arrival}</span>
          </div>
          <span className="text-xs text-muted-foreground">{progressPct}% of journey</span>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full bg-linear-to-r from-gold-soft to-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Timeline updates automatically as your parcel progresses. We'll WhatsApp you at every
          milestone.
        </p>
      </div>

      <div className="mt-10 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
        <div className="text-sm">
          <p className="eyebrow text-muted-foreground">Delivery to</p>
          <p className="mt-2 font-serif text-base">{order.fullName}</p>
          <p className="text-muted-foreground">{order.address}</p>
          <p className="text-muted-foreground">
            {order.city}, {order.state}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            ETA window:{" "}
            <span className="text-foreground">
              {order.etaDays[0]}–{order.etaDays[1]} working days
            </span>
          </p>
        </div>
        <div>
          <p className="eyebrow text-muted-foreground">Items</p>
          <ul className="mt-2 space-y-2 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span>
                  {it.qty} × {it.name}
                </span>
                <span className="text-muted-foreground">{naira(it.qty * it.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-foreground">{naira(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-foreground">{naira(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-sm text-foreground">
              <span className="eyebrow">Total</span>
              <span className="font-serif">{naira(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function etaWindow(createdAt: number, etaDays: [number, number]) {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const start = new Date(createdAt + etaDays[0] * 24 * 60 * 60 * 1000);
  const end = new Date(createdAt + etaDays[1] * 24 * 60 * 60 * 1000);
  return `${fmt(start)} – ${fmt(end)}`;
}

export type { OrderStatus };
