import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/store/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  FolderTree,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, rehydrated } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const pathname = location.pathname;
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage || !rehydrated) return;

    // If not authenticated or not staff, redirect to admin login
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
    } else if (user && !user.is_staff) {
      navigate({ to: "/admin/login" });
    }
  }, [isAuthenticated, user, navigate, isLoginPage, rehydrated]);

  if (!rehydrated) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoginPage && (!isAuthenticated || (user && !user.is_staff))) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/admin/login" });
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    { label: "Products", icon: Package, to: "/admin/products" },
    { label: "Categories", icon: FolderTree, to: "/admin/categories" },
    { label: "Marketing", icon: Megaphone, to: "/admin/marketing" },
    { label: "Orders", icon: ShoppingBag, to: "/admin/orders" },
    { label: "Customers", icon: Users, to: "/admin/customers" },
    { label: "Settings", icon: Settings, to: "/admin/settings" },
  ];

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-noir">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-noir text-nude w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          !isSidebarOpen && "-translate-x-full md:w-20",
          isSidebarOpen && "translate-x-0",
        )}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-10 px-2">
            <Link to="/admin" className={cn("flex flex-col", !isSidebarOpen && "md:hidden")}>
              <span className="font-serif text-xl tracking-widest uppercase text-gold">Bee's</span>
              <span className="text-[8px] tracking-[0.4em] uppercase text-white/40 -mt-1">
                Admin Panel
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden md:block"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 group"
                activeProps={{
                  className: "bg-gold text-noir shadow-lg shadow-gold/20",
                }}
              >
                <item.icon className="h-5 w-5 flex-none" />
                <span className={cn("font-medium", !isSidebarOpen && "md:hidden")}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="pt-4 mt-auto border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className={cn("font-medium", !isSidebarOpen && "md:hidden")}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 flex-none">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-50 rounded-lg md:hidden"
            >
              <Menu className="h-6 w-6 text-noir" />
            </button>

            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, products..."
                className="w-full bg-gray-50 border-none rounded-full py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 hover:bg-gray-50 rounded-full transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-gold rounded-full border-2 border-white" />
            </button>
            <div className="h-10 w-10 rounded-full bg-noir text-gold flex items-center justify-center font-bold uppercase">
              {user?.username?.substring(0, 2) || "AD"}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
