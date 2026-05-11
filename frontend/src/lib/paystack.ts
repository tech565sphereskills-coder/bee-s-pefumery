/**
 * Paystack inline integration.
 * Loads https://js.paystack.co/v1/inline.js on demand and opens the popup.
 *
 * NOTE: PUBLIC test key is safe to ship in client code. Replace with the
 * brand's live public key (pk_live_...) when going to production.
 */
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

type PaystackHandler = {
  openIframe: () => void;
};

type PaystackPop = {
  setup: (opts: {
    key: string;
    email: string;
    amount: number; // kobo
    currency?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    callback: (resp: { reference: string; status?: string; trxref?: string }) => void;
    onClose: () => void;
  }) => PaystackHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

let loadingPromise: Promise<void> | null = null;

export function loadPaystack(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.PaystackPop) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Failed to load Paystack"));
    };
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export type PaystackArgs = {
  email: string;
  amountNaira: number;
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess: (ref: string) => void;
  onClose?: () => void;
};

export async function payWithPaystack(args: PaystackArgs) {
  await loadPaystack();
  if (!window.PaystackPop) throw new Error("Paystack not available");
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: args.email,
    amount: Math.round(args.amountNaira * 100),
    currency: "NGN",
    ref: args.reference,
    metadata: args.metadata,
    callback: (resp) => args.onSuccess(resp.reference),
    onClose: () => args.onClose?.(),
  });
  handler.openIframe();
}
