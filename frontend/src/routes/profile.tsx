import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Star,
  Pencil,
  Check,
  X,
  Package,
  AlertTriangle,
} from "lucide-react";
import { useProfile, type Address } from "@/store/profile";
import { useOrders } from "@/store/orders";
import { NIGERIAN_STATES } from "@/data/shipping";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Bee's Perfumery" },
      {
        name: "description",
        content: "Manage your saved addresses, phone number and order history for faster checkout.",
      },
    ],
  }),
  component: ProfilePage,
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 \-()]{7,20}$/, "Enter a valid phone number"),
});

const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  recipient: z.string().trim().min(2, "Recipient is required").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9 \-()]{7,20}$/, "Enter a valid phone"),
  street: z.string().trim().min(4, "Street is too short").max(200),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "Select a state"),
});

type Section = "details" | "addresses" | "orders";

function ProfilePage() {
  const profile = useProfile((s) => s.profile);
  const setProfile = useProfile((s) => s.setProfile);
  const addresses = useProfile((s) => s.addresses);
  const addAddress = useProfile((s) => s.addAddress);
  const updateAddress = useProfile((s) => s.updateAddress);
  const removeAddress = useProfile((s) => s.removeAddress);
  const setDefault = useProfile((s) => s.setDefault);
  const orders = useOrders((s) => s.orders);

  const [section, setSection] = useState<Section>("details");
  const [pForm, setPForm] = useState(profile);
  const [pErrors, setPErrors] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const blank: Omit<Address, "id"> = {
    label: "",
    recipient: "",
    phone: "",
    street: "",
    city: "",
    state: "",
  };
  const [aForm, setAForm] = useState<Omit<Address, "id">>(blank);
  const [aErrors, setAErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse(pForm);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setPErrors(fe);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setPErrors({});
    setProfile(parsed.data);
    toast.success("Profile saved", { description: "Your details will autofill at checkout." });
  };

  const startNew = () => {
    setAForm(blank);
    setEditingId("new");
    setAErrors({});
  };
  const startEdit = (a: Address) => {
    setAForm(a);
    setEditingId(a.id);
    setAErrors({});
  };
  const cancelEdit = () => {
    setEditingId(null);
    setAErrors({});
  };

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = addressSchema.safeParse(aForm);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setAErrors(fe);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (editingId === "new") {
      addAddress(parsed.data);
      toast.success("Address added", {
        description: `${parsed.data.label} saved to your address book.`,
      });
    } else if (editingId) {
      updateAddress(editingId, parsed.data);
      toast.success("Address updated");
    }
    setEditingId(null);
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    const label = confirmDelete.label;
    removeAddress(confirmDelete.id);
    setConfirmDelete(null);
    toast.success("Address removed", { description: `${label} has been deleted.` });
  };

  const navItems: { key: Section; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "details", label: "Personal Details", icon: <User className="h-4 w-4" /> },
    {
      key: "addresses",
      label: "Addresses",
      icon: <MapPin className="h-4 w-4" />,
      count: addresses.length,
    },
    { key: "orders", label: "Orders", icon: <Package className="h-4 w-4" />, count: orders.length },
  ];

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-20">
        <div>
          <p className="eyebrow text-gold">My Account</p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Profile & Addresses</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Save your contact details and delivery addresses so checkout takes seconds — not
            minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside>
            <nav className="border border-border bg-card p-2 lg:sticky lg:top-28">
              <ul className="space-y-1">
                {navItems.map((it) => {
                  const active = section === it.key;
                  return (
                    <li key={it.key}>
                      <button
                        onClick={() => setSection(it.key)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${active ? "bg-gold text-nude" : "text-foreground hover:bg-secondary"}`}
                      >
                        <span className="inline-flex items-center gap-3">
                          {it.icon}
                          {it.label}
                        </span>
                        {typeof it.count === "number" && (
                          <span
                            className={`text-[10px] tracking-[0.2em] ${active ? "text-nude/80" : "text-muted-foreground"}`}
                          >
                            {it.count.toString().padStart(2, "0")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div>
            <AnimatePresence mode="wait">
              {section === "details" && (
                <motion.section
                  key="details"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-gold">
                      <User className="h-4 w-4" />
                    </span>
                    <h2 className="font-serif text-2xl">Personal Details</h2>
                  </div>
                  <form
                    onSubmit={handleSaveProfile}
                    className="mt-8 grid gap-5 sm:grid-cols-2"
                    noValidate
                  >
                    <div className="sm:col-span-2">
                      <Field
                        icon={<User className="h-4 w-4" />}
                        label="Full name"
                        value={pForm.fullName}
                        onChange={(v) => setPForm((s) => ({ ...s, fullName: v }))}
                        error={pErrors.fullName}
                      />
                    </div>
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      type="email"
                      value={pForm.email}
                      onChange={(v) => setPForm((s) => ({ ...s, email: v }))}
                      error={pErrors.email}
                    />
                    <Field
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      type="tel"
                      value={pForm.phone}
                      placeholder="+234 ..."
                      onChange={(v) => setPForm((s) => ({ ...s, phone: v }))}
                      error={pErrors.phone}
                    />
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-foreground py-3.5 eyebrow text-background hover:bg-gold transition-colors"
                      >
                        Save details
                      </button>
                    </div>
                  </form>
                </motion.section>
              )}

              {section === "addresses" && (
                <motion.section
                  key="addresses"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-gold">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <h2 className="font-serif text-2xl">Saved Addresses</h2>
                    </div>
                    {editingId === null && (
                      <button
                        onClick={startNew}
                        className="inline-flex items-center gap-2 eyebrow text-gold hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add new
                      </button>
                    )}
                  </div>

                  <div className="mt-6 space-y-4">
                    {addresses.length === 0 && editingId === null && (
                      <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No addresses saved yet. Add one to autofill checkout.
                      </div>
                    )}

                    <AnimatePresence mode="popLayout">
                      {addresses.map((a) =>
                        editingId === a.id ? (
                          <motion.div
                            key={a.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <AddressForm
                              value={aForm}
                              errors={aErrors}
                              onChange={setAForm}
                              onSubmit={submitAddress}
                              onCancel={cancelEdit}
                            />
                          </motion.div>
                        ) : (
                          <motion.article
                            key={a.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`relative border p-5 text-sm ${a.isDefault ? "border-gold bg-gold/5" : "border-border"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-serif text-lg">
                                  {a.label}
                                  {a.isDefault && (
                                    <span className="ml-2 eyebrow text-gold">Default</span>
                                  )}
                                </p>
                                <p className="mt-1 text-foreground">
                                  {a.recipient} · {a.phone}
                                </p>
                                <p className="mt-1 text-muted-foreground">{a.street}</p>
                                <p className="text-muted-foreground">
                                  {a.city}, {a.state}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {!a.isDefault && (
                                  <button
                                    onClick={() => {
                                      setDefault(a.id);
                                      toast.success(`${a.label} set as default`);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold"
                                  >
                                    <Star className="h-3 w-3" /> Default
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(a)}
                                  className="inline-flex items-center gap-1 text-xs hover:text-gold"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(a)}
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            </div>
                          </motion.article>
                        ),
                      )}

                      {editingId === "new" && (
                        <motion.div
                          key="new"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <AddressForm
                            value={aForm}
                            errors={aErrors}
                            onChange={setAForm}
                            onSubmit={submitAddress}
                            onCancel={cancelEdit}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.section>
              )}

              {section === "orders" && (
                <motion.section
                  key="orders"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-gold">
                      <Package className="h-4 w-4" />
                    </span>
                    <h2 className="font-serif text-2xl">Recent Orders</h2>
                  </div>
                  {orders.length === 0 ? (
                    <p className="mt-6 text-sm text-muted-foreground">
                      No orders yet.{" "}
                      <Link to="/shop" className="text-gold hover:underline">
                        Browse fragrances →
                      </Link>
                    </p>
                  ) : (
                    <ul className="mt-6 divide-y divide-border">
                      {orders.map((o) => (
                        <li
                          key={o.reference}
                          className="flex items-center justify-between gap-3 py-4 text-sm"
                        >
                          <div>
                            <p className="font-mono text-xs">{o.reference}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString()} · {o.items.length}{" "}
                              item(s)
                            </p>
                          </div>
                          <Link
                            to="/track"
                            search={{ ref: o.reference }}
                            className="eyebrow text-gold hover:text-foreground"
                          >
                            Track →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-noir/70 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 w-full max-w-md border border-border bg-background p-8 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl">Remove address?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This will permanently delete{" "}
                    <span className="text-foreground">{confirmDelete.label}</span> from your address
                    book. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="border border-foreground/30 px-5 py-2.5 eyebrow hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="inline-flex items-center gap-2 bg-destructive px-5 py-2.5 eyebrow text-destructive-foreground hover:opacity-90 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddressForm({
  value,
  errors,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: Omit<Address, "id">;
  errors: Record<string, string>;
  onChange: (v: Omit<Address, "id">) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="border border-gold bg-gold/5 p-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Label (Home, Office)"
          value={value.label}
          onChange={(v) => onChange({ ...value, label: v })}
          error={errors.label}
        />
        <Field
          label="Recipient name"
          value={value.recipient}
          onChange={(v) => onChange({ ...value, recipient: v })}
          error={errors.recipient}
        />
        <Field
          label="Phone"
          type="tel"
          value={value.phone}
          onChange={(v) => onChange({ ...value, phone: v })}
          error={errors.phone}
        />
        <Field
          label="City"
          value={value.city}
          onChange={(v) => onChange({ ...value, city: v })}
          error={errors.city}
        />
        <div className="sm:col-span-2">
          <Field
            label="Street address"
            value={value.street}
            onChange={(v) => onChange({ ...value, street: v })}
            error={errors.street}
          />
        </div>
        <div>
          <label className="eyebrow block text-muted-foreground">Country</label>
          <div className="mt-2 border-b border-foreground/30 py-2 text-sm text-muted-foreground">
            🇳🇬 Nigeria
          </div>
        </div>
        <div>
          <label className="eyebrow block text-muted-foreground">State</label>
          <select
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            className={`mt-2 w-full border-b bg-transparent py-2 text-sm focus:outline-none ${errors.state ? "border-destructive" : "border-foreground/30 focus:border-gold"}`}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 eyebrow text-background hover:bg-gold transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 border border-foreground/30 px-5 py-2.5 eyebrow hover:bg-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  icon,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="eyebrow block text-muted-foreground">{label}</label>
      <div
        className={`mt-2 flex items-center gap-3 border-b py-2 transition-colors ${error ? "border-destructive" : "border-foreground/30 focus-within:border-gold"}`}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
