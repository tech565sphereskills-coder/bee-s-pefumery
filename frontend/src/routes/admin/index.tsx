import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

const salesData = [
  { name: "Mon", sales: 450000 },
  { name: "Tue", sales: 520000 },
  { name: "Wed", sales: 480000 },
  { name: "Thu", sales: 610000 },
  { name: "Fri", sales: 590000 },
  { name: "Sat", sales: 850000 },
  { name: "Sun", sales: 780000 },
];

function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("dashboard/stats/");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="eyebrow animate-pulse">Loading analytics...</p>
      </div>
    );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-noir">Executive Overview</h2>
          <p className="text-gray-400 text-sm">
            Welcome back. Here is what's happening with Bee's Perfumery today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="bg-noir text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gold transition-all"
          >
            Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="bg-white border border-gray-100 text-noir px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-gold transition-all"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          trend={`${stats?.revenueGrowth || 0}%`}
          up={true}
          icon={TrendingUp}
          color="bg-gold/10 text-gold"
        />
        <KPICard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          trend={`${stats?.orderGrowth || 0}%`}
          up={true}
          icon={ShoppingBag}
          color="bg-noir/5 text-noir"
        />
        <KPICard
          title="Total Products"
          value={stats?.totalProducts || 0}
          trend="Inventory"
          up={true}
          icon={Package}
          color="bg-noir/5 text-noir"
        />
        <KPICard
          title="Low Stock"
          value={stats?.lowStock || 0}
          trend={(stats?.lowStock || 0) > 0 ? "Alert" : "Optimal"}
          up={false}
          icon={AlertTriangle}
          color={
            (stats?.lowStock || 0) > 0 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
          }
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Sales Chart (Keep static for now or sync if data available) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-serif text-xl text-noir">Sales Performance</h3>
              <p className="text-sm text-gray-400">Weekly revenue overview</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesData || salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickFormatter={(v) => `₦${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#120d14",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#D4AF37" }}
                  formatter={(v: any) => [`₦${v.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-xl text-noir">Recent Orders</h3>
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-6">
            {stats?.recentOrders?.map((order: any) => (
              <div
                key={order.order_id}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                    <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-noir text-sm">{order.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {order.order_id} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-noir text-sm">
                      ₦{parseFloat(order.total_amount).toLocaleString()}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider",
                        order.status === "paid"
                          ? "bg-green-50 text-green-600"
                          : order.status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-blue-600",
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/${order.phone?.replace(/[^0-9]/g, "")}?text=Hello ${order.full_name}, this is Bee's Perfumery regarding your order ${order.order_id}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-green-50 rounded-lg text-gray-300 hover:text-green-500 transition-all tooltip-trigger"
                    title="Message via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-10">No recent orders</p>
            )}
          </div>
          <Link
            to="/admin/orders"
            className="mt-8 w-full py-3 bg-gray-50 hover:bg-noir hover:text-white rounded-xl text-sm font-medium transition-all text-center"
          >
            View All Orders
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Low Stock Alerts */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="font-serif text-xl text-noir">Inventory Alerts</h3>
          </div>
          <div className="space-y-4">
            {(stats?.lowStockItems || []).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-noir">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{item.stock} left</p>
                  <Link
                    to="/admin/products"
                    className="text-[10px] text-gold uppercase tracking-widest font-bold"
                  >
                    Restock
                  </Link>
                </div>
              </div>
            ))}
            {(!stats?.lowStockItems || stats.lowStockItems.length === 0) && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">Inventory levels are healthy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gold/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-gold" />
            </div>
            <h3 className="font-serif text-xl text-noir">Top Sellers</h3>
          </div>
          <div className="space-y-4">
            {(stats?.topProducts || []).map((item: any, index: number) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-serif text-gold/40">0{index + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-noir">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.brand}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-noir">
                  ₦{parseFloat(item.price).toLocaleString()}
                </p>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-10">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, up, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:border-gold/50 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-3 rounded-2xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            up ? "text-green-600" : trend === "Critical" ? "text-red-500" : "text-gray-400",
          )}
        >
          {up ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            trend !== "Critical" && <ArrowDownRight className="h-4 w-4" />
          )}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-noir">{value}</h4>
      </div>
    </div>
  );
}
