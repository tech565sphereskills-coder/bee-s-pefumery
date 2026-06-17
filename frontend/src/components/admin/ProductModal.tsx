import { useState, useEffect } from "react";
import { X, Upload, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import api from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
}

interface Variant {
  id?: number;
  size_ml: number | string;
  price: string;
  stock: number | string;
  sku: string;
  is_active: boolean;
  sort_order: number | string;
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

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    discount_price: "",
    stock: "0",
    category: "",
    is_active: true,
    best_seller: false,
    slug: "",
    notes: {
      top: [] as string[],
      heart: [] as string[],
      base: [] as string[],
    },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ id?: number; file?: File; preview: string; isExisting?: boolean }[]>([]);
  const [deletedGalleryIds, setDeletedGalleryIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("categories/");
        const data = res.data.results || res.data;
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        description: product.description || "",
        price: product.price || "",
        discount_price: product.discount_price || "",
        stock: product.stock?.toString() || "0",
        category: product.category?.toString() || "",
        is_active: product.is_active ?? true,
        best_seller: product.best_seller ?? false,
        slug: product.slug || "",
        notes: product.notes || { top: [], heart: [], base: [] },
      });
      setImagePreview(product.image || null);
      if (product.gallery) {
        setGallery(
          product.gallery.map((item) => ({
            id: item.id,
            preview: item.image,
            isExisting: true,
          }))
        );
      } else {
        setGallery([]);
      }
      setVariants(
        product.variants?.map((v) => ({
          id: v.id,
          size_ml: v.size_ml,
          price: v.price,
          stock: v.stock,
          sku: v.sku || "",
          is_active: v.is_active ?? true,
          sort_order: v.sort_order || 0,
        })) || []
      );
      setDeletedGalleryIds([]);
    } else {
      setFormData({
        name: "",
        brand: "",
        description: "",
        price: "",
        discount_price: "",
        stock: "0",
        category: "",
        is_active: true,
        best_seller: false,
        slug: "",
        notes: { top: [], heart: [], base: [] },
      });
      setImagePreview(null);
      setGallery([]);
      setVariants([]);
      setDeletedGalleryIds([]);
    }
    setImageFile(null);
  }, [product, isOpen]);

  const addVariant = () => {
    const nextSort = variants.length > 0 ? Math.max(...variants.map(v => Number(v.sort_order))) + 1 : 1;
    setVariants([...variants, {
      size_ml: 50,
      price: formData.price || "0",
      stock: formData.stock || "0",
      sku: "",
      is_active: true,
      sort_order: nextSort,
    }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        isExisting: false,
      }));
      setGallery((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveGalleryItem = (index: number) => {
    const item = gallery[index];
    if (item.isExisting && item.id) {
      setDeletedGalleryIds((prev) => [...prev, item.id!]);
    } else if (item.preview) {
      URL.revokeObjectURL(item.preview);
    }
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!product && !imageFile) {
        toast.error("Please upload a product image");
        setLoading(false);
        return;
      }

      const url = product ? `products/${product.slug}/` : `products/`;
      const method = product ? "patch" : "post";

      const finalFormData = { ...formData };
      if (!finalFormData.slug) {
        finalFormData.slug = finalFormData.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      }

      const data = new FormData();
      Object.entries(finalFormData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (key === "notes") {
            data.append(key, JSON.stringify(value));
          } else {
            data.append(key, value.toString());
          }
        }
      });

      if (imageFile) {
        data.append("image", imageFile);
      }

      // Append new gallery images
      gallery.forEach((item) => {
        if (item.file) {
          data.append("gallery_images", item.file);
        }
      });

      // Append deleted gallery image IDs
      if (deletedGalleryIds.length > 0) {
        data.append("deleted_gallery_images", JSON.stringify(deletedGalleryIds));
      }

      // Append variants
      if (variants.length > 0) {
        data.append("variants", JSON.stringify(variants.map((v) => ({
          id: v.id,
          size_ml: Number(v.size_ml),
          price: v.price,
          stock: Number(v.stock),
          sku: v.sku,
          is_active: v.is_active,
          sort_order: Number(v.sort_order),
        }))));
      }

      await api({
        method,
        url,
        data,
      });

      toast.success(product ? "Product updated!" : "Product created!");
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
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl text-noir">
                {product ? "Edit Product" : "Add New Product"}
              </h3>
              <p className="text-sm text-gray-400">Fill in the fragrance details</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Image Upload Area */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Product Imagery
              </label>
              <div
                onClick={() => document.getElementById("product-image")?.click()}
                className="relative h-48 w-full bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100 hover:border-gold/30 hover:bg-gold/2 transition-all cursor-pointer overflow-hidden group"
              >
                {imagePreview ? (
                  <div className="relative h-full w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-contain p-4"
                    />
                    <div className="absolute inset-0 bg-noir/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" /> Replace Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-noir/60">Upload Product Image</p>
                      <p className="text-[10px]">PNG, JPG or WEBP up to 5MB</p>
                    </div>
                  </div>
                )}
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Gallery Images Area */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Product Gallery (Additional Images)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gallery.map((item, idx) => (
                  <div key={idx} className="relative aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group">
                    <img src={item.preview} alt={`Gallery ${idx}`} className="h-full w-full object-cover p-2" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryItem(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                <div
                  onClick={() => document.getElementById("gallery-upload")?.click()}
                  className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gold/30 hover:bg-gold/2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-gray-400"
                >
                  <Upload className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium text-noir/60">Add Images</span>
                  <input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Product Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                  placeholder="e.g. Midnight Oud"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Brand
                </label>
                <input
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                  placeholder="e.g. Bee's Collection"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20 resize-none"
                placeholder="Describe the scent notes..."
              />
            </div>

            {/* Fragrance Notes */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                Fragrance Olfactory Notes
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Top Notes</label>
                  <input
                    value={formData.notes?.top?.join(", ") || ""}
                    onChange={(e) => {
                      const top = e.target.value.split(",").map(n => n.trim()).filter(Boolean);
                      setFormData({ ...formData, notes: { ...(formData.notes || {}), top } });
                    }}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-gold/20"
                    placeholder="e.g. Bergamot, Lemon"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Heart Notes</label>
                  <input
                    value={formData.notes?.heart?.join(", ") || ""}
                    onChange={(e) => {
                      const heart = e.target.value.split(",").map(n => n.trim()).filter(Boolean);
                      setFormData({ ...formData, notes: { ...(formData.notes || {}), heart } });
                    }}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-gold/20"
                    placeholder="e.g. Rose, Jasmine"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Base Notes</label>
                  <input
                    value={formData.notes?.base?.join(", ") || ""}
                    onChange={(e) => {
                      const base = e.target.value.split(",").map(n => n.trim()).filter(Boolean);
                      setFormData({ ...formData, notes: { ...(formData.notes || {}), base } });
                    }}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-gold/20"
                    placeholder="e.g. Amber, Musk"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Price (₦)
                </label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Discount (₦)
                </label>
                <input
                  type="number"
                  value={formData.discount_price}
                  onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Base Stock
                </label>
                <input
                  required
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                  Size Variants (e.g. 30ml, 50ml, 100ml)
                </label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1 text-xs font-bold text-gold hover:text-gold/70 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Size
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-xs text-gray-400 italic ml-1">
                  No variants defined. Product will use the base price and stock above.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-20 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400">Size (ml)</label>
                        <input
                          type="number"
                          value={v.size_ml}
                          onChange={(e) => updateVariant(idx, "size_ml", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 px-2 text-xs focus:ring-2 focus:ring-gold/20"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400">Price (₦)</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(idx, "price", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 px-2 text-xs focus:ring-2 focus:ring-gold/20"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400">Stock</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 px-2 text-xs focus:ring-2 focus:ring-gold/20"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400">SKU</label>
                        <input
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 px-2 text-xs focus:ring-2 focus:ring-gold/20"
                          placeholder="e.g. midnight-oud-50ml"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  URL Slug
                </label>
                <input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-gold/20"
                  placeholder="e.g. midnight-oud (auto-generated if empty)"
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-200 text-gold focus:ring-gold"
                />
                <span className="text-sm font-medium text-noir group-hover:text-gold transition-colors">
                  Active
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.best_seller}
                  onChange={(e) => setFormData({ ...formData, best_seller: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-200 text-gold focus:ring-gold"
                />
                <span className="text-sm font-medium text-noir group-hover:text-gold transition-colors">
                  Best Seller
                </span>
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-noir text-white px-8 py-3 rounded-xl eyebrow flex items-center gap-2 hover:bg-noir-soft disabled:opacity-50 transition-all shadow-xl shadow-noir/10"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Product
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
