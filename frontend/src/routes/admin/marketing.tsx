import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Ticket,
  Mail,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  amount: number;
  valid_until: string;
  active: boolean;
}

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
}

export const Route = createFileRoute("/admin/marketing")({
  component: MarketingDashboard,
});

function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState<"coupons" | "subscribers">("coupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Coupon Form State
  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discount_type: string;
    amount: number;
    valid_until: string;
    active: boolean;
  }>({
    code: "",
    discount_type: "percentage",
    amount: 0,
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cpRes, subRes] = await Promise.all([api.get("coupons/"), api.get("subscribers/")]);
      setCoupons(cpRes.data.results || cpRes.data);
      setSubscribers(subRes.data.results || subRes.data);
    } catch (err) {
      toast.error("Failed to fetch marketing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`coupons/${id}/`);
      toast.success("Coupon deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("coupons/", newCoupon);
      toast.success("Coupon created successfully");
      setShowModal(false);
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        amount: 0,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        active: true,
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;
    try {
      await api.delete(`subscribers/${id}/`);
      toast.success("Subscriber removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove subscriber");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif">Marketing & Growth</h1>
          <p className="text-gray-500 mt-1">Manage promotions and your customer mailing list.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "coupons" ? (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gold text-noir px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" /> Create Coupon
            </button>
          ) : (
            <button className="inline-flex items-center gap-2 bg-noir text-nude px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("coupons")}
          className={cn(
            "px-6 py-4 font-medium transition-all relative",
            activeTab === "coupons" ? "text-gold" : "text-gray-500 hover:text-gray-700",
          )}
        >
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4" /> Coupons
          </div>
          {activeTab === "coupons" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          className={cn(
            "px-6 py-4 font-medium transition-all relative",
            activeTab === "subscribers" ? "text-gold" : "text-gray-500 hover:text-gray-700",
          )}
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Newsletter Subscribers
          </div>
          {activeTab === "subscribers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
          )}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "coupons" ? "Search by code..." : "Search by email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          {activeTab === "coupons" ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Code</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Valid Until</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/20" />
                    </tr>
                  ))
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-serif">
                      No coupons found. Start by creating one.
                    </td>
                  </tr>
                ) : (
                  coupons
                    .filter((c) => c.code.toLowerCase().includes(search.toLowerCase()))
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-noir">{c.code}</td>
                        <td className="px-6 py-4 capitalize text-sm">{c.discount_type}</td>
                        <td className="px-6 py-4 font-semibold">
                          {c.discount_type === "percentage" ? `${c.amount}%` : `₦${c.amount}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(c.valid_until).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {c.active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email Address</th>
                  <th className="px-6 py-4 font-semibold">Joined At</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-6 py-4 h-16 bg-gray-50/20" />
                    </tr>
                  ))
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-serif">
                      No subscribers yet.
                    </td>
                  </tr>
                ) : (
                  subscribers
                    .filter((s) => s.email.toLowerCase().includes(search.toLowerCase()))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-noir font-medium">{s.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.subscribed_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(s.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-gray-50">
          {activeTab === "coupons" ? (
            loading ? (
              <div className="p-8 text-center animate-pulse text-gray-400 eyebrow">Loading...</div>
            ) : coupons.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-serif italic">No coupons.</div>
            ) : (
              coupons.map((c) => (
                <div key={c.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-noir text-lg">{c.code}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">{c.discount_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gold">
                        {c.discount_type === "percentage" ? `${c.amount}%` : `₦${c.amount}`}
                      </p>
                      {c.active ? (
                        <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest">Active</span>
                      ) : (
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400">
                      Expires: {new Date(c.valid_until).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : loading ? (
            <div className="p-8 text-center animate-pulse text-gray-400 eyebrow">Loading...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-serif italic">No subscribers.</div>
          ) : (
            subscribers.map((s) => (
              <div key={s.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-noir text-sm">{s.email}</p>
                  <p className="text-[10px] text-gray-400">
                    Joined: {new Date(s.subscribed_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSubscriber(s.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-serif">Create Coupon</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="SUMMER25"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Type
                  </label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Amount
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, amount: Number(e.target.value) })}
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Valid Until
                </label>
                <input
                  type="date"
                  required
                  value={newCoupon.valid_until}
                  onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-noir text-nude py-4 rounded-2xl font-bold tracking-widest uppercase hover:bg-gold hover:text-noir transition-all disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Generate Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
