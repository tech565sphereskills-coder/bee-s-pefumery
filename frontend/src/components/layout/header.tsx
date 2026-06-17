import { useState, useEffect } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, LogOut, ChevronDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, cartCount } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { useProfile } from "@/store/profile";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, logout, user } = useAuth();
  const profile = useProfile((s) => s.profile);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = profile.fullName
    ? profile.fullName.split(" ")[0]
    : user
      ? user.first_name || user.username
      : "User";

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user
      ? (user.first_name?.[0] || user.username?.[0] || "U").toUpperCase()
      : "U";

  const avatarUrl = profile.avatar || user?.avatar;

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
              <div 
                className="hidden md:block relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 group focus:outline-none py-2"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover border border-gold/40 group-hover:border-gold shadow-[0_0_10px_rgba(212,175,55,0.1)] transition-colors duration-300"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-serif text-xs font-semibold group-hover:bg-gold/20 transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                      {initials}
                    </div>
                  )}
                  <span className="eyebrow text-xs tracking-[0.1em] text-foreground/80 group-hover:text-gold transition-colors flex items-center gap-1 uppercase">
                    {displayName}
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", dropdownOpen && "rotate-180")} />
                  </span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-1 w-52 border border-border bg-background p-4 shadow-xl z-50 rounded-sm"
                    >
                      <div className="pb-3 mb-2 border-b border-border/40 text-left">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Bonjour,</p>
                        <p className="font-serif text-base text-foreground font-medium truncate">{profile.fullName || user?.username}</p>
                      </div>
                      <ul className="space-y-1.5 text-left">
                        {user?.is_staff && (
                          <li>
                            <Link
                              to="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="eyebrow flex items-center gap-2 text-xs text-gold hover:text-foreground transition-colors py-1"
                            >
                              <Shield className="h-3.5 w-3.5" /> Admin Panel
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link
                            to="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="eyebrow flex items-center gap-2 text-xs text-foreground/80 hover:text-gold transition-colors py-1"
                          >
                            <User className="h-3.5 w-3.5" /> My Profile
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left eyebrow flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Logout
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <div className="w-full flex flex-col items-center mt-6">
                  {/* Luxury Profile Card */}
                  <div className="w-full bg-secondary/30 border border-border/60 p-5 rounded-md flex flex-col items-center text-center space-y-3 mb-6 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-16 w-16 rounded-full object-cover border-2 border-gold shadow-md"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-gold font-serif text-lg font-bold shadow-sm">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="font-serif text-lg text-foreground tracking-tight">
                        {profile.fullName || user?.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                        {profile.email || user?.email}
                      </p>
                    </div>

                    {user?.is_staff && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 text-gold text-[10px] eyebrow uppercase tracking-widest rounded-full hover:bg-gold/20 transition-all duration-300"
                      >
                        <Shield className="h-3 w-3" /> Admin Portal
                      </Link>
                    )}
                  </div>

                  <div className="w-full flex flex-col gap-3">
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="w-full text-center border border-foreground/30 px-10 py-3.5 eyebrow text-foreground hover:border-gold hover:text-gold transition-colors"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}
                      className="w-full text-center border border-destructive/30 px-10 py-3.5 eyebrow text-destructive hover:bg-destructive hover:text-white transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
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
