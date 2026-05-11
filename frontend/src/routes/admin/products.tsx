import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProductModal } from "@/components/admin/ProductModal";

interface Product {
  id: number;
  name: string;
  brand: string;
  slug: string;
  description: string;
  price: string;
  discount_price?: string;
  stock: number;
  image?: string;
  is_active: boolean;
  category: number;
}

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get("products/");
      const data = res.data.results || res.data;
      setProductsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`products/${slug}/`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const filteredProducts = productsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-noir">Product Management</h2>
          <p className="text-gray-400 text-sm">Manage your inventory, prices and stock levels</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-gold text-white px-6 py-3 rounded-xl eyebrow flex items-center gap-2 hover:bg-gold-soft transition-all shadow-lg shadow-gold/20"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-gold/20 transition-all"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Product
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Brand
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Price
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Stock
                </th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Status
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
                    colSpan={6}
                    className="px-8 py-20 text-center text-gray-400 eyebrow animate-pulse"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden flex-none">
                          <img
                            src={
                              product.image ||
                              "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=200"
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="font-serif text-lg text-noir leading-none">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm text-gray-500">{product.brand}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-medium text-noir">
                        ₦{parseFloat(product.price).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            product.stock < 10 ? "text-amber-600" : "text-gray-600",
                          )}
                        >
                          {product.stock}
                        </span>
                        {product.stock < 10 && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          product.is_active
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600",
                        )}
                      >
                        <div
                          className={cn(
                            "h-1 w-1 rounded-full",
                            product.is_active ? "bg-green-600" : "bg-red-600",
                          )}
                        />
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gold transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.slug)}
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
              Loading products...
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-gray-100 overflow-hidden flex-none">
                    <img
                      src={
                        product.image ||
                        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=200"
                      }
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif text-lg text-noir truncate">{product.name}</h4>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">
                          {product.brand}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                          product.is_active
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600",
                        )}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-serif text-gold font-bold">
                        ₦{parseFloat(product.price).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Stock:</span>
                        <span
                          className={cn(
                            "font-bold",
                            product.stock < 10 ? "text-amber-600" : "text-gray-600",
                          )}
                        >
                          {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-gray-50 text-noir text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.slug)}
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
