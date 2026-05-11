import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: any | null;
  onSuccess: () => void;
}

export function CategoryModal({ isOpen, onClose, category, onSuccess }: CategoryModalProps) {
  const token = useAuth((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
      });
    } else {
      setFormData({
        name: "",
        slug: "",
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = category ? `categories/${category.id}/` : `categories/`;
      const method = category ? "patch" : "post";

      const payload = { ...formData };
      if (!payload.slug) {
        payload.slug = payload.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      }

      await api({
        method,
        url,
        data: payload,
      });

      toast.success(category ? "Category updated!" : "Category created!");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: any } };
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.detail ||
        (errorData && typeof errorData === "object" ? Object.values(errorData)[0] : null) ||
        "Something went wrong";
      toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-noir/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl text-noir">
                {category ? "Edit Category" : "Add Category"}
              </h3>
              <p className="text-sm text-gray-400">Organize your collection</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Category Name
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                placeholder="e.g. Woody & Earthy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                URL Slug
              </label>
              <input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                placeholder="e.g. woody-earthy"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-noir text-white px-8 py-3 rounded-xl eyebrow flex items-center gap-2 hover:bg-noir-soft disabled:opacity-50 transition-all shadow-xl shadow-noir/10"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Category
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
