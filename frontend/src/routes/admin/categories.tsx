import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Edit2, Trash2, FolderTree } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { CategoryModal } from "@/components/admin/CategoryModal";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get("categories/");
      // Handle both paginated and non-paginated responses
      const data = res.data.results || res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure? This may affect products in this category.")) return;
    try {
      await api.delete(`categories/${id}/`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-noir">Category Management</h2>
          <p className="text-gray-400 text-sm">Organize your fragrance collection into types</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-gold text-white px-6 py-3 rounded-xl eyebrow flex items-center gap-2 hover:bg-gold-soft transition-all shadow-lg shadow-gold/20"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-gold/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Category Name
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  URL Slug
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-8 py-20 text-center text-gray-400 eyebrow animate-pulse"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr key={category.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                          <FolderTree className="h-5 w-5" />
                        </div>
                        <span className="font-serif text-lg text-noir">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                        /{category.slug}
                      </code>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gold transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 eyebrow animate-pulse">
              Loading categories...
            </div>
          ) : (
            filtered.map((category) => (
              <div key={category.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                      <FolderTree className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-noir">{category.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                        /{category.slug}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-gray-50 text-noir text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
