import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProductModal } from "@/components/admin/ProductModal";

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
}

interface Variant {
  id: number;
  size_ml: number;
  price: string;
  stock: number;
  sku: string;
  is_active: boolean;
  sort_order: number;
}

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
  best_seller?: boolean;
  variants?: Variant[];
  notes?: {
    top: string[];
    heart: string[];
    base: string[];
  };
  gallery?: ProductImage[];
}

function StockDisplay({ product }: { product: Product }) {
  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "text-sm font-medium",
          totalStock < 10 ? "text-amber-600" : "text-gray-600",
        )}
      >
        {totalStock}
      </span>
      {totalStock < 10 && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
    </div>
  );
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Product
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Brand
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Price / Discount
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Stock
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Variants
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400 eyebrow animate-pulse"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-400 eyebrow"
                    >
                      No products found
                    </td>
                  </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-none">
                          <img
                            src={
                              product.image ||
                              "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=200"
                            }
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="font-serif text-sm text-noir font-medium leading-tight">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500">{product.brand}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.discount_price ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-green-600">
                            ₦{parseFloat(product.discount_price).toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            ₦{parseFloat(product.price).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-noir">
                          ₦{parseFloat(product.price).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StockDisplay product={product} />
                    </td>
                    <td className="px-6 py-4">
                      {product.variants && product.variants.length > 0 ? (
                        <span className="text-sm text-gray-600">
                          {product.variants.length} size{product.variants.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-gold transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.slug)}
                          className="p-1.5 hover:bg-gray-50 rounded text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile & Tablet Compact Grid View */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400 eyebrow animate-pulse">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400 eyebrow">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:border-gold/20 hover:shadow-xs transition-all duration-300 flex flex-col group relative"
              >
                {/* Top: Product Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden flex-none relative">
                  <img
                    src={
                      product.image ||
                      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=200"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Active Status Badge Overlay */}
                  <span
                    className={cn(
                      "absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur shadow-xs",
                      product.is_active
                        ? "text-green-600"
                        : "text-red-600",
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
                </div>

                {/* Middle: Details */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase tracking-wider text-gold font-bold truncate">
                      {product.brand}
                    </p>
                    <h4 className="font-serif text-xs text-noir font-medium line-clamp-2 h-8 leading-tight" title={product.name}>
                      {product.name}
                    </h4>
                  </div>
                  <div className="space-y-0.5 mt-auto">
                    {product.discount_price ? (
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-green-600 text-xs sm:text-sm">
                          ₦{parseFloat(product.discount_price).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-gray-400 line-through">
                          ₦{parseFloat(product.price).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <p className="font-bold text-noir text-xs sm:text-sm">
                        ₦{parseFloat(product.price).toLocaleString()}
                      </p>
                    )}
                    <StockDisplay product={product} />
                    {product.variants && product.variants.length > 0 && (
                      <p className="text-[9px] text-gray-400">
                        {product.variants.length} size variant{product.variants.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom: Quick Actions */}
                <div className="flex border-t border-gray-50 divide-x divide-gray-50 bg-gray-50/50">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.slug)}
                    className="flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
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
