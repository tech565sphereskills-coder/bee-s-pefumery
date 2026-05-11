import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, { message: "Name is too short" }).max(80),
});

const forgotSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
});

type Mode = "login" | "register" | "forgot";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset internal state when re-opened
  useEffect(() => {
    if (open) {
      setForgotSent(false);
      setErrors({});
    }
  }, [open]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setForgotSent(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "forgot") {
      const parsed = forgotSchema.safeParse({ email: values.email });
      if (!parsed.success) {
        setErrors({ email: parsed.error.issues[0]?.message || "Invalid email" });
        toast.error("Please enter a valid email");
        return;
      }
      setSubmitting(true);
      // simulate sending reset email
      setTimeout(() => {
        // Random small failure simulation could go here; we keep it positive.
        setSubmitting(false);
        setForgotSent(true);
        toast.success("Reset link sent", {
          description: `Check ${parsed.data.email} for instructions to reset your password.`,
        });
      }, 1000);
      return;
    }

    const schema = mode === "login" ? loginSchema : registerSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const k = issue.path[0] as string;
        fieldErrors[k] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(mode === "login" ? "Welcome back" : "Account created", {
        description: `Signed in as ${parsed.data.email}`,
      });
      setValues({ name: "", email: "", password: "" });
      onClose();
    }, 900);
  };

  const headerEyebrow =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
        ? "Join the Maison"
        : "Reset your password";
  const headerTitle =
    mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Forgot Password";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-noir/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden bg-background shadow-2xl md:grid-cols-2"
          >
            {/* Visual */}
            <div className="relative hidden bg-noir text-nude p-10 md:block">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, var(--color-gold) 0%, transparent 55%)",
                }}
              />
              <div className="relative flex h-full flex-col justify-between">
                <Logo tone="light" />
                <div>
                  <p className="eyebrow text-gold-soft">Members Only</p>
                  <h3 className="mt-4 font-serif text-3xl leading-tight">
                    Your scent, remembered.
                  </h3>
                  <p className="mt-3 text-sm text-nude/70">
                    Save favourites, track orders, and unlock private launches.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="relative px-6 py-10 md:px-10 md:py-12">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-foreground/70 hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="eyebrow text-gold">{headerEyebrow}</p>
              <h2 className="mt-3 font-serif text-3xl">{headerTitle}</h2>

              {mode === "forgot" && forgotSent ? (
                <div className="mt-10">
                  <div className="border border-gold bg-gold/5 p-6">
                    <p className="font-serif text-xl">Check your inbox</p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      We sent a password-reset link to{" "}
                      <span className="text-foreground">{values.email}</span>. The link expires in
                      30 minutes.
                    </p>
                  </div>
                  <button
                    onClick={() => switchMode("login")}
                    className="mt-6 inline-flex items-center gap-2 eyebrow text-gold hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  {mode === "register" && (
                    <Field
                      icon={<UserIcon className="h-4 w-4" />}
                      label="Full name"
                      value={values.name}
                      onChange={(v) => setValues((s) => ({ ...s, name: v }))}
                      error={errors.name}
                      autoComplete="name"
                    />
                  )}
                  <Field
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    type="email"
                    value={values.email}
                    onChange={(v) => setValues((s) => ({ ...s, email: v }))}
                    error={errors.email}
                    autoComplete="email"
                  />
                  {mode !== "forgot" && (
                    <Field
                      icon={<Lock className="h-4 w-4" />}
                      label="Password"
                      type="password"
                      value={values.password}
                      onChange={(v) => setValues((s) => ({ ...s, password: v }))}
                      error={errors.password}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                  )}

                  {mode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-gold"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 bg-foreground py-4 eyebrow text-background hover:bg-gold hover:text-nude transition-colors disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {submitting
                      ? "Please wait..."
                      : mode === "login"
                        ? "Sign In"
                        : mode === "register"
                          ? "Create Account"
                          : "Send Reset Link"}
                  </button>
                </form>
              )}

              {!forgotSent && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  {mode === "login" && (
                    <>
                      New to Bee&rsquo;s?{" "}
                      <button
                        onClick={() => switchMode("register")}
                        className="text-gold hover:underline"
                      >
                        Create an account
                      </button>
                    </>
                  )}
                  {mode === "register" && (
                    <>
                      Already a member?{" "}
                      <button
                        onClick={() => switchMode("login")}
                        className="text-gold hover:underline"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                  {mode === "forgot" && (
                    <button
                      onClick={() => switchMode("login")}
                      className="inline-flex items-center gap-2 text-gold hover:underline"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to sign in
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  icon,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
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
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
