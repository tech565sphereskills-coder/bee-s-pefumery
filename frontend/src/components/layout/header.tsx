import { useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, cartCount } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, logout } = useAuth();
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const onHome = path === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <>
      <div className="bg-noir text-nude py-2 text-[10px] tracking-[0.2em] uppercase text-center font-medium border-b border-nude/10">
        Free Nationwide Delivery on orders over ₦150k — 100% Original Fragrances
      </div>
      <header
        className={cn(
          "sticky top-0 z-100 border-b transition-all duration-300",
          scrolled
            ? "border-border/80 bg-background/95 backdrop-blur-md shadow-sm"
            : "border-border/40 bg-background/80 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-10">
          {/* Left: Desktop Nav */}
          <nav className="hidden flex-1 items-center gap-8 md:flex">
            <Link to="/" className="eyebrow text-foreground/80 hover:text-gold transition-colors">
              Home
            </Link>
            <Link
              to="/shop"
              className="eyebrow text-foreground/80 hover:text-gold transition-colors"
            >
              Shop
            </Link>
            <a
              href={onHome ? "#collections" : "/#collections"}
              className="eyebrow text-foreground/80 hover:text-gold transition-colors"
            >
              Collections
            </a>
          </nav>

          {/* Center: Logo */}
          <Link to="/" className="flex flex-col items-center group">
            <span className="font-serif text-xl tracking-[0.2em] uppercase md:text-2xl transition-colors group-hover:text-gold">
              Bee&rsquo;s
            </span>
            <span className="text-[8px] tracking-[0.5em] uppercase text-muted-foreground -mt-1">
              Perfumery
            </span>
          </Link>

          {/* Right: Actions */}
          <div className="flex flex-1 items-center justify-end gap-3 md:gap-6">
            <nav className="hidden gap-8 md:flex mr-6">
              <Link
                to="/contact"
                className="eyebrow text-foreground/80 hover:text-gold transition-colors"
              >
                Contact
              </Link>
            </nav>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/profile"
                  className="eyebrow flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="eyebrow flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex eyebrow items-center gap-2 hover:text-gold transition-colors"
              >
                Login
              </Link>
            )}

            <Link to="/cart" className="relative p-1 transition-transform hover:scale-110">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-nude">
                  {count}
                </span>
              )}
            </Link>

            <button onClick={() => setOpen(true)} className="p-1 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-9999 bg-background flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/40">
              <span className="font-serif tracking-widest uppercase">Menu</span>
              <button onClick={() => setOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col items-center gap-7 pt-12 overflow-y-auto px-10">
              <Link to="/" onClick={() => setOpen(false)} className="font-serif text-3xl">
                Home
              </Link>
              <Link to="/shop" onClick={() => setOpen(false)} className="font-serif text-3xl">
                Shop
              </Link>
              <a
                href="/#collections"
                onClick={() => setOpen(false)}
                className="font-serif text-3xl"
              >
                Collections
              </a>
              <Link to="/contact" onClick={() => setOpen(false)} className="font-serif text-3xl">
                Contact
              </Link>

              <div className="w-full h-px bg-nude/10 my-4" />

              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="font-serif text-2xl opacity-80"
              >
                Cart ({count})
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="font-serif text-2xl opacity-80"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="mt-8 w-full border border-destructive/30 px-10 py-4 eyebrow text-destructive hover:bg-destructive hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="mt-8 w-full border border-gold px-10 py-4 eyebrow text-gold text-center hover:bg-gold hover:text-noir transition-colors"
                >
                  Sign In · Register
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
