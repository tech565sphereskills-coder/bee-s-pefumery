import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import api from "@/lib/api";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("subscribers/", { email });
      toast.success("Welcome to the Maison", {
        description: "You've successfully joined our newsletter.",
      });
      setEmail("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { email?: string[] } } };
      const msg = error.response?.data?.email?.[0] || "Failed to subscribe. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-noir text-nude border-t border-nude/5">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-10">
        <div className="grid gap-16 md:grid-cols-4 lg:gap-24">
          <div className="md:col-span-2">
            <div className="text-nude">
              <Logo tone="light" />
            </div>
            <p className="mt-8 max-w-sm text-base leading-relaxed text-nude/70">
              Crafted in Lagos. Composed for those who consider scent a form of personal
              architecture.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-10 flex max-w-sm border-b border-nude/30 focus-within:border-gold transition-colors"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Join the Maison (Email)"
                required
                className="flex-1 bg-transparent py-4 text-sm placeholder:text-nude/30 focus:outline-none"
              />
              <button 
                disabled={loading}
                className="eyebrow text-gold hover:text-nude transition-colors px-4 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-2 lg:gap-12">
            <div>
              <p className="eyebrow text-gold">Shop</p>
              <ul className="mt-8 space-y-4 text-sm text-nude/80">
                <li>
                  <Link to="/shop" className="hover:text-gold transition-colors">
                    All Fragrances
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop"
                    search={{ category: "women" }}
                    className="hover:text-gold transition-colors"
                  >
                    Women
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop"
                    search={{ category: "men" }}
                    className="hover:text-gold transition-colors"
                  >
                    Men
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop"
                    search={{ category: "unisex" }}
                    className="hover:text-gold transition-colors"
                  >
                    Unisex
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="eyebrow text-gold">Maison</p>
              <ul className="mt-8 space-y-4 text-sm text-nude/80">
                <li>
                  <a href="/#story" className="hover:text-gold transition-colors">
                    Our Story
                  </a>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-gold transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-gold transition-colors">
                    Shipping
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gold transition-colors">
                    Returns
                  </a>
                </li>
              </ul>
              <div className="mt-10 flex gap-5 text-nude/60">
                <a href="#" aria-label="Instagram" className="hover:text-gold transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Facebook" className="hover:text-gold transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Twitter" className="hover:text-gold transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-nude/10 pt-10 text-center text-[10px] tracking-widest uppercase text-nude/40 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} Bee&rsquo;s Perfumery. Nigeria.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-nude transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-nude transition-colors">
              Terms
            </a>
          </div>
          <p>Architecture of Scent.</p>
        </div>
      </div>
    </footer>
  );
}
