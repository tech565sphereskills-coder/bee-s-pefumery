import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "@/store/auth";
import { useProfile } from "@/store/profile";

const API_URL = "http://localhost:8000/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Bee's Perfumery" },
      {
        name: "description",
        content: "Sign in or create an account to track orders and save your favourite fragrances.",
      },
    ],
  }),
  component: Login,
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});
const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Name is too short").max(80),
});
const forgotSchema = z.object({ email: z.string().trim().email("Enter a valid email").max(255) });

type Mode = "login" | "register" | "forgot";

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const setProfile = useProfile((s) => s.setProfile);
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setForgotSent(false);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSubmitting(true);
      try {
        const res = await axios.post(`${API_URL}/auth/google/`, {
          access_token: tokenResponse.access_token,
        });
        const { access_token, refresh_token, user } = res.data;
        setAuth(access_token, refresh_token, user);

        // Sync user details to profile store
        if (user) {
          const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
          setProfile({ fullName, email: user.email });
        }

        toast.success("Welcome back!");
        if (user?.is_staff) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/" });
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        toast.error("Google login failed", {
          description: error.response?.data?.detail || "Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "forgot") {
      const parsed = forgotSchema.safeParse({ email: values.email });
      if (!parsed.success) {
        setErrors({ email: parsed.error.issues[0].message });
        toast.error("Please enter a valid email");
        return;
      }
      setSubmitting(true);
      try {
        await axios.post(`${API_URL}/auth/password/reset/`, { email: parsed.data.email });
        setForgotSent(true);
        toast.success("Reset link sent");
      } catch (err) {
        toast.error("Failed to send reset link");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const schema = mode === "login" ? loginSchema : registerSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] = i.message));
      setErrors(fe);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const res = await axios.post(`${API_URL}/auth/login/`, {
          email: values.email,
          password: values.password,
        });
        const { access_token, refresh_token, user } = res.data;
        setAuth(access_token, refresh_token, user);

        // Sync user details
        if (user) {
          const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username;
          setProfile({ fullName, email: user.email });
        }

        toast.success("Welcome back");
        if (user?.is_staff) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/" });
        }
      } else {
        await axios.post(`${API_URL}/auth/registration/`, {
          username: values.email,
          email: values.email,
          password: values.password,
          password1: values.password,
          password2: values.password,
          first_name: values.name,
          phone_number: values.phone,
        });
        toast.success("Account created! You can now sign in.");
        setMode("login");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { non_field_errors?: string[] } } };
      toast.error(mode === "login" ? "Login failed" : "Registration failed", {
        description: error.response?.data?.non_field_errors?.[0] || "Check your credentials.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const eyebrow =
    mode === "login" ? "Welcome back" : mode === "register" ? "Join the Maison" : "Reset password";
  const title =
    mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Forgot Password";

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden bg-noir text-nude grain lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-noir via-noir to-noir/70" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(circle at 30% 30%, var(--color-gold) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-nude"
          >
            <Logo tone="light" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <p className="eyebrow text-gold">Members Only</p>
            <h2 className="mt-6 font-serif text-4xl leading-tight">
              Track your orders, save your favourites, and unlock private launches.
            </h2>
          </motion.div>
        </div>
      </div>

      {/* Form side — mobile-first */}
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-20 lg:px-12">
        <div className="w-full max-w-md">
          <div key={mode + (forgotSent ? "-sent" : "")}>
            <p className="eyebrow text-gold">{eyebrow}</p>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl">{title}</h1>

            {mode === "forgot" && forgotSent ? (
              <div className="mt-8">
                <div className="border border-gold bg-gold/5 p-6">
                  <p className="font-serif text-xl">Check your inbox</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    We sent a reset link to <span className="text-foreground">{values.email}</span>.
                    The link expires in 30 minutes.
                  </p>
                </div>
                <button
                  onClick={() => switchMode("login")}
                  className="mt-6 inline-flex items-center gap-2 eyebrow text-gold transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6 sm:mt-10 sm:space-y-7"
                noValidate
              >
                {mode === "register" && (
                  <div className="space-y-4">
                    <Field
                      icon={<UserIcon className="h-4 w-4" />}
                      label="Full name"
                      value={values.name}
                      onChange={(v) => setValues((s) => ({ ...s, name: v }))}
                      error={errors.name}
                      autoComplete="name"
                    />
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      label="Phone number"
                      type="tel"
                      value={values.phone}
                      onChange={(v) => setValues((s) => ({ ...s, phone: v }))}
                      error={errors.phone}
                      autoComplete="tel"
                    />
                  </div>
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
                      className="text-xs text-muted-foreground transition-colors hover:text-gold"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode !== "forgot" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleGoogleLogin()}
                      disabled={submitting}
                      className="flex min-h-[56px] w-full items-center justify-center gap-3 border border-foreground/10 py-4 eyebrow transition-colors hover:bg-foreground/5 disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="relative flex items-center py-2">
                      <div className="grow border-t border-foreground/10"></div>
                      <span className="mx-4 shrink text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        OR
                      </span>
                      <div className="grow border-t border-foreground/10"></div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-[56px] w-full items-center justify-center gap-2 bg-[#120d14] py-4 eyebrow text-[#f2e9f3] transition-colors hover:bg-[#B026B5] disabled:opacity-60"
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
              <div className="mt-10 text-center text-sm text-muted-foreground">
                {mode === "login" && (
                  <p>
                    New to Bee&rsquo;s?{" "}
                    <button
                      onClick={() => switchMode("register")}
                      className="text-gold transition-colors hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                )}
                {mode === "register" && (
                  <p>
                    Already a member?{" "}
                    <button
                      onClick={() => switchMode("login")}
                      className="text-gold transition-colors hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === "forgot" && (
                  <button
                    onClick={() => switchMode("login")}
                    className="inline-flex items-center gap-2 text-gold transition-colors hover:underline font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </button>
                )}
              </div>
            )}
          </div>

          <Link
            to="/"
            className="mt-10 hidden text-center text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground lg:block"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
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
    <div className="group">
      <label className="eyebrow block text-foreground/70 transition-colors group-focus-within:text-gold">
        {label}
      </label>
      <div
        className={`mt-2 flex items-center gap-3 border-b py-2.5 transition-all ${
          error
            ? "border-destructive"
            : "border-foreground/20 focus-within:border-gold focus-within:shadow-[0_1px_0_0_var(--color-gold)]"
        }`}
      >
        {icon && (
          <span className="text-foreground/60 transition-colors group-focus-within:text-gold">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-xs text-destructive overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
