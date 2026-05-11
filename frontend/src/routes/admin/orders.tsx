import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const token = useAuth((s) => s.token);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const itemsPerPage = 10;

  const statuses = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  const fetchOrders = async () => {
    try {
      const res = await api.get("orders/");
      const data = res.data.results || res.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`orders/${orderId}/`, {
        status: newStatus.toLowerCase(),
      });
      toast.success("Order Updated", {
        description: `Order status has been changed to ${newStatus}`,
      });
      fetchOrders();
    } catch (err) {
      toast.error("Update Failed", {
        description: "Could not update the order status.",
      });
    }
  };

  const handleWhatsAppUpdate = (order: any) => {
    const message = `Hello ${order.full_name}, this is Bee's Perfumery. Your order ${order.order_id} status has been updated to: ${order.status.toUpperCase()}. You can track it here: ${window.location.origin}/track?ref=${order.order_id}`;
    const url = `https://wa.me/${order.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      activeStatus === "All" || o.status.toLowerCase() === activeStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="eyebrow animate-pulse">Accessing order registry...</p>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-noir">Order Hub</h2>
          <p className="text-gray-400 text-sm">Fulfillment center for your luxury fragrance orders.</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => {
              setActiveStatus(status);
              setCurrentPage(1);
            }}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
              activeStatus === status
                ? "bg-noir text-gold shadow-xl shadow-noir/10"
                : "bg-white text-gray-400 border border-gray-100 hover:border-gold/30",
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Order & Date
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Customer
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Amount
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Verification
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 text-right">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-noir text-sm">{order.order_id}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-medium text-noir text-sm">{order.full_name}</span>
                      <a
                        href={`https://wa.me/${order.phone?.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold uppercase tracking-wider hover:underline mt-1"
                      >
                        <MessageCircle className="h-3 w-3" /> Connect WhatsApp
                      </a>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-noir text-sm">
                    ₦{parseFloat(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        order.payment_verified
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500",
                      )}
                    >
                      {order.payment_verified ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {order.payment_verified ? "Verified" : "Awaiting"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className={cn(
                        "bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 cursor-pointer p-0",
                        order.status === "delivered"
                          ? "text-green-600"
                          : order.status === "shipped"
                            ? "text-blue-600"
                            : order.status === "processing"
                              ? "text-amber-600"
                              : order.status === "cancelled"
                                ? "text-red-500"
                                : "text-gray-400",
                      )}
                    >
                      {statuses.slice(1).map((s) => (
                        <option key={s} value={s.toLowerCase()}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-noir hover:text-white rounded-lg text-gray-300 transition-all"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppUpdate(order)}
                        className="p-2 hover:bg-green-500 hover:text-white rounded-lg text-gray-300 transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <AlertCircle className="h-10 w-10" />
                      <p className="text-sm font-serif italic">No orders found in this category.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-50">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-noir text-sm">{order.order_id}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-noir text-sm">
                    ₦{parseFloat(order.total_amount).toLocaleString()}
                  </p>
                  <span
                    className={cn(
                      "text-[8px] font-bold uppercase tracking-wider",
                      order.payment_verified ? "text-green-600" : "text-red-500",
                    )}
                  >
                    {order.payment_verified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-noir">{order.full_name}</p>
                  <a
                    href={`https://wa.me/${order.phone?.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  className={cn(
                    "bg-white border border-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider px-2 py-1 outline-none",
                    order.status === "delivered" ? "text-green-600" : "text-amber-600",
                  )}
                >
                  {statuses.slice(1).map((s) => (
                    <option key={s} value={s.toLowerCase()}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {paginatedOrders.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm font-serif italic">
              No orders found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Page <span className="text-noir">{currentPage}</span> of{" "}
              <span className="text-noir">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-white transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif">Order Details</h3>
                <p className="text-sm text-gray-400 font-mono">{selectedOrder.order_id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 text-noir">
              <div className="grid grid-cols-2 gap-8 text-left">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Customer
                  </h4>
                  <p className="font-medium">{selectedOrder.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.email}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Shipping Address
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedOrder.address}
                    <br />
                    {selectedOrder.city}, {selectedOrder.state}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 text-left">
                  Items Summary
                </h4>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center font-serif text-gold">
                          B
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400">QTY: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">
                        ₦{parseFloat(item.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Grand Total
                  </p>
                  <p className="text-2xl font-serif text-gold">
                    ₦{parseFloat(selectedOrder.total_amount).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleWhatsAppUpdate(selectedOrder)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Send Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
