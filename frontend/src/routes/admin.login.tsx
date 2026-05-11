import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Mail, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/store/auth";

const API_URL = "http://localhost:8000/api";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login/`, {
        email,
        password,
      });

      const { access, refresh, user } = res.data;

      if (!user?.is_staff) {
        toast.error("Access Denied", {
          description: "This portal is restricted to administrative personnel only.",
        });
        return;
      }

      setAuth(access, refresh, user);
      toast.success("Identity Verified", {
        description: `Welcome back, Commissioner ${user.first_name || user.username}`,
      });
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { non_field_errors?: string[] } } };
      toast.error("Authentication Failed", {
        description:
          error.response?.data?.non_field_errors?.[0] || "Invalid administrative credentials.",
      });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Dynamic Luxury Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[150px] animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[150px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#D4AF37 0.5px, transparent 0.5px)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Branding Header */}
        <div className="text-center mb-12 space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-gold font-serif text-4xl tracking-[0.2em] uppercase mb-1">Bee's</h2>
            <h3 className="text-white/40 text-[10px] tracking-[0.6em] uppercase">Perfumery</h3>
          </motion.div>
        </div>

        <div className="bg-white/2 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-20 w-20 bg-gold/10 rounded-3xl flex items-center justify-center mb-8 border border-gold/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]"
            >
              <ShieldCheck className="h-10 w-10 text-gold" />
            </motion.div>
            <h1 className="text-nude font-serif text-3xl text-center tracking-tight">
              Admin Portal
            </h1>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.4em] mt-3">
              Secure Management Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                Administrative ID
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/3 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-nude placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                Security Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/3 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-nude placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold hover:bg-[#EBC050] text-noir font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group disabled:opacity-50 shadow-[0_10px_40px_rgba(212,175,55,0.15)] active:scale-[0.98]"
            >
              {submitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">Authenticate Access</span>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-white/5 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/20 hover:text-gold transition-colors text-[10px] uppercase tracking-[0.3em] font-medium"
            >
              <ArrowLeft className="h-3 w-3" /> Return to Storefront
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center space-y-1 opacity-20">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white">
            System Integrity Verified &bull; End-to-End Encryption
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-white">
            &copy; {new Date().getFullYear()} Bee&rsquo;s Perfumery Corporate Systems
          </p>
        </div>
      </motion.div>
    </div>
  );
}
