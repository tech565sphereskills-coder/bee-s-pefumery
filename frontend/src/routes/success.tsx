import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, MessageSquare, ArrowRight, Share2 } from "lucide-react";
import { z } from "zod";
import { naira } from "@/data/products";
import { useEffect, useState } from "react";
import { useOrders } from "@/store/orders";

const successSearch = z.object({
  ref: z.string(),
});

export const Route = createFileRoute("/success")({
  validateSearch: successSearch,
  head: () => ({
    meta: [
      { title: "Order Successful — Bee's Perfumery" },
      { name: "description", content: "Thank you for your order. We are preparing your luxury fragrances." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { ref } = useSearch({ from: "/success" });
  const orders = useOrders((s) => s.orders);
  const order = orders.find((o) => o.reference === ref);
  const [waLink, setWaLink] = useState("");

  useEffect(() => {
    if (order) {
      const itemsList = order.items.map((i: any) => `- ${i.name} (x${i.qty})`).join("\n");
      const message = `Hello Bee's Perfumery! 🐝\n\nI just placed an order!\n\n*Order Ref:* ${order.reference}\n*Customer:* ${order.fullName}\n*Total:* ${naira(order.total)}\n\n*Items:*\n${itemsList}\n\n*Delivery Address:*\n${order.address}, ${order.city}, ${order.state}\n\nPlease confirm receipt. Thank you!`;
      setWaLink(`https://wa.me/2348103273004?text=${encodeURIComponent(message)}`);
    }
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
          <Link to="/shop" className="eyebrow text-gold">Return to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="mb-10 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full" />
            <CheckCircle className="h-24 w-24 text-gold relative z-10" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="eyebrow text-gold mb-4">Payment Successful</p>
          <h1 className="font-serif text-5xl md:text-6xl mb-6">Thank You.</h1>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Your order <span className="text-noir font-mono font-bold bg-secondary/50 px-2 py-1 rounded">#{ref}</span> has been confirmed. 
            We are now hand-preparing your selection for delivery.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 mb-16">
            <div className="p-8 border border-noir/5 bg-secondary/20 rounded-[2rem] text-left">
              <p className="eyebrow text-gold mb-6">Order Details</p>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Confirmed & Paid</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-serif text-lg">{naira(order.total)}</span>
                </div>
                <div className="pt-4 border-t border-noir/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Delivery to</p>
                  <p className="text-sm font-medium">{order.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{order.address}, {order.city}</p>
                </div>
              </div>
            </div>

            <div className="p-8 border border-gold/30 bg-gold/5 rounded-[2rem] text-left flex flex-col justify-between">
              <div>
                <p className="eyebrow text-gold mb-4">Instant Notification</p>
                <p className="text-sm text-noir/70 leading-relaxed mb-6">
                  Click the button below to send your order confirmation directly to our WhatsApp. 
                  This ensures the fastest processing of your luxury parcel.
                </p>
              </div>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#128C7E] transition-all shadow-xl shadow-green-500/20"
              >
                <MessageSquare className="h-4 w-4" /> Confirm via WhatsApp
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/track"
              search={{ ref }}
              className="flex items-center gap-3 text-noir eyebrow hover:text-gold transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Live Order Tracking <ArrowRight className="h-3 w-3" />
            </Link>
            <div className="h-px w-12 bg-noir/10 hidden sm:block" />
            <Link
              to="/shop"
              className="flex items-center gap-3 text-noir eyebrow hover:text-gold transition-colors"
            >
              Continue Shopping <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
