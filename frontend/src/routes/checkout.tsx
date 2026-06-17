import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Truck,
  Clock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, cartSubtotal } from "@/store/cart";
import { naira } from "@/data/products";
import api from "@/lib/api";
import { ProductImage } from "@/components/shop/product-image";
import { NIGERIAN_STATES, quoteShipping } from "@/data/shipping";
import { useProfile } from "@/store/profile";
import { useOrders, generateOrderRef } from "@/store/orders";
import { payWithPaystack, PAYSTACK_PUBLIC_KEY } from "@/lib/paystack";


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Bee's Perfumery" },
      { name: "description", content: "Complete your order securely with Paystack." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = cartSubtotal(items);

  const profile = useProfile((s) => s.profile);
  const addresses = useProfile((s) => s.addresses);
  const addOrder = useOrders((s) => s.add);

  const defaultAddr = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0],
    [addresses],
  );
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastRef, setLastRef] = useState<string | null>(null);

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    amount: number;
    discount_type: string;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Autofill from saved default address on first render
  useEffect(() => {
    if (defaultAddr && !selectedAddrId) {
      setSelectedAddrId(defaultAddr.id);
      applyAddress(defaultAddr.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultAddr]);

  const applyAddress = (id: string) => {
    setSelectedAddrId(id);
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setFullName(a.recipient || profile.fullName);
    setPhone(a.phone || profile.phone);
    setAddress(a.street);
    setCity(a.city);
    setStateName(a.state);
  };

  const quote = useMemo(() => quoteShipping(stateName), [stateName]);
  const shipping = quote?.fee ?? 0;
  
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discount_type === "percentage") {
      return (subtotal * coupon.amount) / 100;
    }
    return coupon.amount;
  }, [subtotal, coupon]);

  const total = subtotal - discount + (items.length > 0 && quote ? shipping : 0);

  if (items.length === 0) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-5 text-center">
        <div>
          <h1 className="font-serif text-4xl">Nothing to checkout.</h1>
          <Link to="/shop" className="mt-6 inline-block eyebrow text-gold">
            Browse fragrances
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in your contact details");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email");
      return false;
    }
    if (!address.trim() || !city.trim()) {
      toast.error("Please enter your delivery address");
      return false;
    }
    if (!quote) {
      toast.error("Please select a delivery state");
      return false;
    }
    return true;
  };

  const placeOrder = async (paymentRef: string) => {
    const reference = paymentRef || generateOrderRef();
    const orderData = {
      order_id: reference,
      full_name: fullName,
      email: email,
      phone: phone,
      address: `${address}, ${city}, ${stateName}`,
      total_amount: total,
      status: "paid",
      payment_verified: !!paymentRef,
      payment_reference: paymentRef || "",
      items: items.map((i) => ({
        product: i.id.split('_v')[0],
        quantity: i.qty,
        price: i.price,
        variant_id: i.variant?.id || null,
        variant_label: i.variant?.label || "",
      })),
    };

    try {
      // Send to backend
      await api.post("orders/", orderData);

      // Keep in local store for immediate tracking UX
      addOrder({
        reference,
        createdAt: Date.now(),
        email,
        phone,
        fullName,
        address,
        city,
        state: stateName,
        items,
        subtotal,
        shipping,
        total,
        status: "paid",
        paymentRef,
        etaDays: quote ? [quote.etaMin, quote.etaMax] : [3, 5],
      });

      clear();
      toast.success("Payment confirmed", {
        description: `Order ${reference} placed. We'll WhatsApp you updates.`,
      });
      navigate({ to: "/success", search: { ref: reference } });
    } catch (err) {
      console.error("Failed to save order to backend", err);
      toast.error("Order process error", {
        description:
          "Payment was successful but we had trouble saving the order. Please contact support with your reference: " +
          reference,
      });
    }
  };

  /**
   * Simulated Paystack webhook verification.
   * In production, the server's /api/webhooks/paystack endpoint would verify
   * the signature header and call /verify before creating the order. Here we
   * mimic that handshake on the client so the UX feels real (occasional
   * declines, clear error states, retry).
   */
  const verifyPaystackPayment = async (
    reference: string,
  ): Promise<{ ok: true } | { ok: false; reason: string }> => {
    try {
      const res = await api.post("orders/verify_payment/", { reference });
      if (res.data.status === true && res.data.data.status === "success") {
        return { ok: true };
      }
      return { ok: false, reason: res.data.message || "Payment verification failed." };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return {
        ok: false,
        reason: error.response?.data?.message || "Could not connect to payment server.",
      };
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post("coupons/validate/", { code: couponCode });
      setCoupon(res.data);
      toast.success("Coupon applied", { description: `${res.data.code} is now active.` });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const msg = error.response?.data?.error || "Invalid coupon code";
      toast.error(msg);
      setCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const startPayment = async () => {
    if (!validate()) return;
    setPaymentError(null);
    const reference = generateOrderRef();
    setLastRef(reference);
    setSubmitting(true);

    const useRealPaystack = PAYSTACK_PUBLIC_KEY && !PAYSTACK_PUBLIC_KEY.includes("xxxx");

    const finalize = async (ref: string) => {
      // Webhook verification handshake
      const result = await verifyPaystackPayment(ref);
      setSubmitting(false);
      if (result.ok) {
        setLastRef(null);
        placeOrder(ref);
      } else {
        setPaymentError(result.reason);
        toast.error("Payment failed", { description: result.reason });
      }
    };

    if (useRealPaystack) {
      try {
        await payWithPaystack({
          email,
          amountNaira: PAYSTACK_PUBLIC_KEY.startsWith("pk_test_") && total >= 400000 ? 5000 : total,
          reference,
          metadata: {
            custom_fields: [
              { display_name: "Customer", variable_name: "customer", value: fullName },
              { display_name: "Phone", variable_name: "phone", value: phone },
              { display_name: "State", variable_name: "state", value: stateName },
              { display_name: "Order Note", variable_name: "note", value: note },
            ],
          },
          onSuccess: (ref) => {
            finalize(ref);
          },
          onClose: () => {
            setSubmitting(false);
            toast("Payment cancelled", { description: "You can resume checkout anytime." });
          },
        });
      } catch (err) {
        setSubmitting(false);
        const msg = err instanceof Error ? err.message : "Please try again.";
        setPaymentError(msg);
        toast.error("Could not start Paystack", { description: msg });
      }
    } else {
      // Simulated checkout popup
      toast("Opening Paystack…", {
        description: "Demo mode — add your Paystack public key to charge real cards.",
      });
      setTimeout(() => {
        finalize(reference);
      }, 1100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startPayment();
  };

  const retryPayment = () => {
    startPayment();
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-20">
        <div className="text-center">
          <p className="eyebrow text-gold">Checkout</p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Complete Your Order</h1>
          {addresses.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Tip:{" "}
              <Link to="/profile" className="text-gold hover:underline">
                save an address
              </Link>{" "}
              for one-tap checkout next time.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-16 grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-20"
        >
          <div className="space-y-12">
            {/* Saved addresses dropdown */}
            {addresses.length > 0 && (
              <section>
                <p className="eyebrow text-gold">00 — Use a saved address</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                    <select
                      value={selectedAddrId}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) applyAddress(id);
                        else setSelectedAddrId("");
                      }}
                      className="w-full appearance-none border border-border bg-background py-3 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="">— Select a saved address —</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                          {a.isDefault ? " (Default)" : ""} — {a.recipient}, {a.city}, {a.state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Link
                    to="/profile"
                    className="eyebrow text-gold hover:text-foreground whitespace-nowrap"
                  >
                    Manage addresses →
                  </Link>
                </div>
                {selectedAddrId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Name, phone, and delivery details have been auto-filled below.
                  </p>
                )}
              </section>
            )}

            {/* Contact */}
            <section>
              <p className="eyebrow text-gold">01 — Contact</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Full name" required value={fullName} onChange={setFullName} />
                <Field
                  label="Phone number"
                  type="tel"
                  required
                  value={phone}
                  onChange={setPhone}
                  placeholder="+234 ..."
                />
                <div className="md:col-span-2">
                  <Field label="Email" type="email" required value={email} onChange={setEmail} />
                </div>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <p className="eyebrow text-gold">02 — Delivery</p>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Delivery address" required value={address} onChange={setAddress} />
                </div>
                <Field label="City" required value={city} onChange={setCity} />
                <div>
                  <label className="eyebrow block text-muted-foreground">
                    State <span className="text-gold">*</span>
                  </label>
                  <select
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-sm focus:border-gold focus:outline-none"
                  >
                    <option value="">Select your state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="eyebrow block text-muted-foreground">
                    Delivery note <span className="lowercase tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-sm focus:border-gold focus:outline-none"
                    placeholder="Landmarks, gate codes, time preferences..."
                  />
                </div>
              </div>

              {/* Live shipping quote */}
              <AnimatePresence mode="wait">
                {quote ? (
                  <motion.div
                    key={quote.zone}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="mt-8 grid gap-4 border border-gold/40 bg-gold/5 p-5 sm:grid-cols-3"
                  >
                    <div className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-5 w-5 text-gold" />
                      <div>
                        <p className="eyebrow text-gold">Zone</p>
                        <p className="mt-1 font-serif text-base">{quote.zone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-gold" />
                      <div>
                        <p className="eyebrow text-gold">ETA</p>
                        <p className="mt-1 font-serif text-base">
                          {quote.etaMin}–{quote.etaMax} working days
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow text-gold">Delivery fee</p>
                      <p className="mt-1 font-serif text-base">{naira(quote.fee)}</p>
                    </div>
                  </motion.div>
                ) : stateName ? (
                  <p className="mt-6 text-sm text-destructive">
                    We couldn't find a delivery quote for this state — please contact us via
                    WhatsApp.
                  </p>
                ) : (
                  <div className="mt-8 border border-border bg-secondary/30 p-5">
                    <p className="eyebrow text-gold">Delivery Tiers</p>
                    <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <li className="flex justify-between gap-3">
                        <span>Lagos</span>
                        <span className="text-foreground">{naira(2500)} · 1–2d</span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>South-West</span>
                        <span className="text-foreground">{naira(3500)} · 2–3d</span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>Abuja / FCT</span>
                        <span className="text-foreground">{naira(4500)} · 2–4d</span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>South-South / East</span>
                        <span className="text-foreground">{naira(4500)}+ · 3–5d</span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>North-Central</span>
                        <span className="text-foreground">{naira(5000)}+ · 3–6d</span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span>North-West / East</span>
                        <span className="text-foreground">{naira(5500)}+ · 4–8d</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-[11px] text-muted-foreground/80">
                      Pick your state above for an instant quote.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Payment */}
            <section>
              <p className="eyebrow text-gold">03 — Payment</p>
              <label className="mt-6 flex cursor-pointer items-center gap-4 border border-gold p-5">
                <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-gold">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                </span>
                <div className="flex-1">
                  <p className="font-serif text-lg">Paystack</p>
                  <p className="text-xs text-muted-foreground">
                    Cards, bank transfer & USSD — secured by Paystack
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 eyebrow text-gold">
                  <ShieldCheck className="h-3 w-3" /> Selected
                </span>
              </label>
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-border bg-secondary/30 p-8">
              <p className="eyebrow text-gold">Order Summary</p>
              <ul className="mt-6 space-y-5">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0">
                        <ProductImage src={item.image} alt={item.name} aspect="aspect-square" />
                        <span className="absolute -right-2 -top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-noir text-[10px] text-nude">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-2 text-sm">
                        <div>
                          <span className="font-serif">{item.name}</span>
                          {item.variant && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {item.variant.label}
                            </p>
                          )}
                        </div>
                        <span>{naira(item.qty * item.price)}</span>
                      </div>
                    </li>
                  ))}
              </ul>
              <div className="my-6 h-px bg-border" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{naira(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Delivery{" "}
                    {quote && (
                      <span className="text-gold/80">
                        · {quote.etaMin}-{quote.etaMax}d
                      </span>
                    )}
                  </dt>
                  <dd>
                    {quote ? naira(shipping) : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
                {coupon && (
                  <div className="flex justify-between text-gold">
                    <dt className="flex items-center gap-1">
                      Coupon ({coupon.code}) 
                      <button 
                        type="button"
                        onClick={() => { setCoupon(null); setCouponCode(""); }} 
                        className="hover:text-foreground text-[10px]"
                      >
                        [Remove]
                      </button>
                    </dt>
                    <dd>-{naira(discount)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-6 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode}
                  className="eyebrow bg-noir text-nude px-4 py-2 text-[10px] hover:bg-gold hover:text-noir transition-colors disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </div>
              <div className="my-6 h-px bg-border" />
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Total</span>
                <motion.span
                  key={total}
                  initial={{ opacity: 0.4, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-serif text-3xl"
                >
                  {naira(total)}
                </motion.span>
              </div>
              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 border border-destructive/40 bg-destructive/5 p-4"
                  role="alert"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="flex-1 text-sm">
                      <p className="font-serif text-base text-destructive">
                        Payment did not go through
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{paymentError}</p>
                      {lastRef && (
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          Ref: {lastRef}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={retryPayment}
                    disabled={submitting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-destructive/60 bg-background py-2.5 eyebrow text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry payment
                  </button>
                </motion.div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="mt-8 flex w-full items-center justify-center gap-2 bg-foreground py-4 eyebrow text-background hover:bg-gold hover:text-nude transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
                  </>
                ) : paymentError ? (
                  <>
                    Try again <Check className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Pay with Paystack <Check className="h-3 w-3" />
                  </>
                )}
              </button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Secured payment by Paystack. By placing your order, you agree to our terms of sale.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="eyebrow block text-muted-foreground">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-sm focus:border-gold focus:outline-none"
      />
    </div>
  );
}
