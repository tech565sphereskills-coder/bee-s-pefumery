import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, CreditCard, Truck, Save, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const token = useAuth((s) => s.token);
  const [activeTab, setActiveTab] = useState("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    store_name: "",
    contact_email: "",
    whatsapp_number: "",
    delivery_fee_lagos: 0,
    delivery_fee_others: 0,
    paystack_public_key: "",
    paystack_secret_key: "",
    cod_enabled: true,
  });
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("settings/1/");
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("settings/1/", settings);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "store", label: "Store Info", icon: SettingsIcon },
    { id: "payment", label: "Payments", icon: CreditCard },
    { id: "delivery", label: "Delivery", icon: Truck },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="eyebrow animate-pulse">Loading settings...</p>
      </div>
    );

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="font-serif text-3xl text-noir">Settings</h2>
        <p className="text-gray-400 text-sm">
          Configure your store, payment gateways and operational preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Tab Navigation */}
        <div className="lg:w-64 space-y-2 flex-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-medium transition-all text-left",
                activeTab === tab.id
                  ? "bg-gold text-white shadow-lg shadow-gold/20"
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100",
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
          {activeTab === "store" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  WhatsApp Concierge Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    placeholder="e.g. 2348123456789"
                    className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Include country code without the + sign.
                </p>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-noir text-white px-10 py-4 rounded-xl eyebrow flex items-center gap-2 hover:bg-gold transition-all disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 bg-gold/5 rounded-2xl border border-gold/10 flex items-start gap-4">
                <div className="p-3 bg-gold rounded-xl text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-noir">Paystack Integration</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Accept payments via cards, transfers and USSD safely across Nigeria.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Public Key
                  </label>
                  <input
                    type="text"
                    value={settings.paystack_public_key}
                    onChange={(e) =>
                      setSettings({ ...settings, paystack_public_key: e.target.value })
                    }
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={settings.paystack_secret_key}
                      onChange={(e) =>
                        setSettings({ ...settings, paystack_secret_key: e.target.value })
                      }
                      className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors"
                    >
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Never share your secret key with anyone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                <div>
                  <h4 className="font-bold text-noir">Enable Cash on Delivery</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Allow customers to pay when their fragrance is delivered.
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, cod_enabled: !settings.cod_enabled })}
                  className={cn(
                    "h-7 w-14 rounded-full relative transition-colors duration-300",
                    settings.cod_enabled ? "bg-gold" : "bg-gray-300",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 h-5 w-5 bg-white rounded-full shadow-sm transition-all duration-300",
                      settings.cod_enabled ? "right-1" : "left-1",
                    )}
                  />
                </button>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-noir text-white px-10 py-4 rounded-xl eyebrow flex items-center gap-2 hover:bg-gold transition-all disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Lagos Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_fee_lagos}
                    onChange={(e) =>
                      setSettings({ ...settings, delivery_fee_lagos: e.target.value })
                    }
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Other States Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_fee_others}
                    onChange={(e) =>
                      setSettings({ ...settings, delivery_fee_others: e.target.value })
                    }
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-noir text-white px-10 py-4 rounded-xl eyebrow flex items-center gap-2 hover:bg-gold transition-all disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
