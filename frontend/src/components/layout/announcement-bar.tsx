import { Truck, ShieldCheck, Phone } from "lucide-react";
import { motion } from "framer-motion";

export function AnnouncementBar() {
  return (
    <div className="bg-noir text-nude border-b border-nude/10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <div className="flex h-9 items-center justify-between text-[10px] md:text-[11px] tracking-[0.2em] uppercase whitespace-nowrap">
          <div className="flex items-center gap-10 md:hidden animate-marquee whitespace-nowrap">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-3 w-3 text-gold" /> Free delivery in Lagos over ₦80,000
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-gold" /> 100% Authentic — Pay on delivery
              available
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-nude/70">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-3 w-3 text-gold" /> Free delivery in Lagos over ₦80,000
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-gold" /> 100% Authentic — Pay on delivery
              available
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 text-gold/80 shrink-0">
            <Phone className="h-3 w-3" /> +234 810 327 3004
          </div>
        </div>
      </div>
      <style>{`
      @keyframes marquee {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      .animate-marquee {
        animation: marquee 20s linear infinite;
      }
    `}</style>
    </div>
  );
}
