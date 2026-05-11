import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./cart";

export type OrderStatus = "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export type Order = {
  reference: string;
  createdAt: number;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentRef?: string;
  etaDays: [number, number];
};

type OrdersState = {
  orders: Order[];
  add: (o: Order) => void;
  findByRef: (ref: string) => Order | undefined;
  findByPhone: (phone: string) => Order[];
};

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      add: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      findByRef: (ref) =>
        get().orders.find((o) => o.reference.toLowerCase() === ref.trim().toLowerCase()),
      findByPhone: (phone) => {
        const norm = phone.replace(/\D/g, "");
        if (!norm) return [];
        return get().orders.filter((o) => o.phone.replace(/\D/g, "").endsWith(norm.slice(-10)));
      },
    }),
    { name: "bees-orders" },
  ),
);

export const generateOrderRef = () =>
  "BEE-" +
  Date.now().toString(36).toUpperCase() +
  "-" +
  Math.random().toString(36).slice(2, 6).toUpperCase();

export const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "paid", label: "Payment Confirmed" },
  { key: "processing", label: "Preparing Your Parcel" },
  { key: "shipped", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

/**
 * Compute the live status of an order based on time elapsed since creation
 * and the delivery ETA window. This makes the timeline progress automatically
 * even though we have no real fulfilment backend.
 *
 * Returns: live status, current step index, and a 0–1 progress value across
 * the full timeline (used for the progress bar).
 */
export function computeLiveStatus(order: Order): {
  status: OrderStatus;
  stepIndex: number;
  progress: number;
} {
  if (order.status === "cancelled") return { status: "cancelled", stepIndex: 0, progress: 0 };

  const now = Date.now();
  const elapsedMs = Math.max(0, now - order.createdAt);
  const totalMs = order.etaDays[1] * 24 * 60 * 60 * 1000;
  const ratio = totalMs > 0 ? Math.min(1, elapsedMs / totalMs) : 0;

  // Map elapsed ratio to one of the 4 timeline steps.
  // 0–10%   → paid
  // 10–45%  → processing
  // 45–90%  → shipped
  // 90–100% → delivered
  let stepIndex = 0;
  if (ratio >= 0.9) stepIndex = 3;
  else if (ratio >= 0.45) stepIndex = 2;
  else if (ratio >= 0.1) stepIndex = 1;
  else stepIndex = 0;

  const status = STATUS_STEPS[stepIndex].key;
  return { status, stepIndex, progress: ratio };
}
