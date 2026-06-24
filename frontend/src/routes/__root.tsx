import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { EntranceLoader } from "@/components/layout/entrance-loader";
import { PageTransition } from "@/components/layout/page-transition";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow text-gold">404</p>
        <h1 className="mt-4 font-serif text-5xl">Page not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you&rsquo;re looking for has drifted away like a forgotten note.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-block border border-foreground px-8 py-3 eyebrow hover:bg-foreground hover:text-background transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bee's Perfumery — Luxury Fragrances, Crafted in Lagos" },
      {
        name: "description",
        content:
          "Discover Bee's Perfumery — a Nigerian house of luxury fragrances. Editorial scents for women, men and unisex. Shop signature perfumes online.",
      },
      { name: "author", content: "Bee's Perfumery" },
      { property: "og:title", content: "Bee's Perfumery — Luxury Fragrances" },
      {
        property: "og:description",
        content:
          "A Nigerian house of luxury fragrances. Composed for those who consider scent a form of personal architecture.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { useEffect } from "react";
import { useSettings } from "@/store/settings";
import { useWishlist } from "@/store/wishlist";

function RootComponent() {
  const fetchSettings = useSettings((s) => s.fetchSettings);
  const initWishlist = useWishlist((s) => s.init);
  const wishlistLoaded = useWishlist((s) => s.loaded);
  const location = useLocation();
  const pathname = location.pathname;
  const isAdminPath = pathname.startsWith("/admin");

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!wishlistLoaded) initWishlist();
  }, [initWishlist, wishlistLoaded]);

  return (
    <GoogleOAuthProvider clientId="34279959598-d7tittmk6eev7g7sctn3a6l2p2mgnp3l.apps.googleusercontent.com">
      <div className="flex min-h-screen flex-col">
        {!isAdminPath && <AnnouncementBar />}
        {!isAdminPath && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!isAdminPath && <Footer />}
        {!isAdminPath && (
          <motion.a
            href="https://wa.me/2348103273004"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            className="fixed bottom-8 right-8 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:bg-[#128C7E]"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.a>
        )}
        <Toaster position="top-right" expand={false} richColors closeButton />
      </div>
    </GoogleOAuthProvider>
  );
}
