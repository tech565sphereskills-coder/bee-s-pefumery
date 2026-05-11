import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import p5 from "@/assets/product-5.jpg";
import p6 from "@/assets/product-6.jpg";
import p7 from "@/assets/product-7.jpg";
import p8 from "@/assets/product-8.jpg";

export type Category = "men" | "women" | "unisex";

export type Product = {
  id: string | number;
  slug?: string;
  name: string;
  brand: string;
  category: string | number;
  category_name?: string;
  price: number | string;
  image: string;
  gallery?: string[];
  description: string;
  notes?: { top: string[]; heart: string[]; base: string[] };
  stock: number;
  rating?: number;
  reviewCount?: number;
  bestSeller?: boolean;
};

export const products: Product[] = [
  {
    id: "amber-noir",
    name: "Amber Noir",
    brand: "Bee's Atelier",
    category: "unisex",
    price: 78000,
    image: p1,
    gallery: [p1, p4, p7],
    description:
      "An opulent oriental composition built on a foundation of smoked amber, aged oud and warm vanilla. A signature for those who arrive without announcement.",
    notes: {
      top: ["Bergamot", "Pink Pepper", "Saffron"],
      heart: ["Bulgarian Rose", "Oud", "Leather"],
      base: ["Amber", "Vanilla", "Sandalwood"],
    },
    stock: 12,
    rating: 4.9,
    reviewCount: 187,
    bestSeller: true,
  },
  {
    id: "rose-de-lagos",
    name: "Rose de Lagos",
    brand: "Bee's Atelier",
    category: "women",
    price: 65000,
    image: p2,
    gallery: [p2, p4, p1],
    description:
      "A modern rose softened by lychee, framed in white musk. Tender, urban, unmistakably feminine.",
    notes: {
      top: ["Lychee", "Pink Pepper"],
      heart: ["Damask Rose", "Peony", "Magnolia"],
      base: ["White Musk", "Cedarwood"],
    },
    stock: 18,
    rating: 4.8,
    reviewCount: 142,
    bestSeller: true,
  },
  {
    id: "noir-imperial",
    name: "Noir Impérial",
    brand: "Maison Bee",
    category: "men",
    price: 92000,
    image: p3,
    gallery: [p3, p6, p8],
    description:
      "A nocturnal masculine: tobacco leaf, dark patchouli and a whisper of incense. Worn by those who choose presence over performance.",
    notes: {
      top: ["Bergamot", "Black Pepper"],
      heart: ["Tobacco", "Patchouli", "Incense"],
      base: ["Vetiver", "Leather", "Tonka Bean"],
    },
    stock: 9,
    rating: 4.9,
    reviewCount: 210,
    bestSeller: true,
  },
  {
    id: "miel-doré",
    name: "Miel Doré",
    brand: "Bee's Atelier",
    category: "women",
    price: 54000,
    image: p4,
    gallery: [p4, p2, p7],
    description: "Honeyed warmth threaded with orange blossom and benzoin. Gold made wearable.",
    notes: {
      top: ["Orange Blossom", "Mandarin"],
      heart: ["Honey", "Jasmine"],
      base: ["Benzoin", "Vanilla"],
    },
    stock: 22,
    rating: 4.7,
    reviewCount: 96,
    bestSeller: true,
  },
  {
    id: "vert-savane",
    name: "Vert Savane",
    brand: "Maison Bee",
    category: "unisex",
    price: 58000,
    image: p5,
    gallery: [p5, p7, p2],
    description:
      "Dewy fig leaf, cardamom and white tea. A clean, contemporary green for the daylight hours.",
    notes: {
      top: ["Bergamot", "Cardamom"],
      heart: ["Fig Leaf", "White Tea"],
      base: ["Vetiver", "Musk"],
    },
    stock: 16,
    rating: 4.6,
    reviewCount: 73,
  },
  {
    id: "rouge-velours",
    name: "Rouge Velours",
    brand: "Maison Bee",
    category: "women",
    price: 88000,
    image: p6,
    gallery: [p6, p8, p1],
    description: "A velvet chypre — blackcurrant, plum and Damascus rose laid over deep oakmoss.",
    notes: {
      top: ["Blackcurrant", "Plum"],
      heart: ["Damascus Rose", "Iris"],
      base: ["Oakmoss", "Patchouli"],
    },
    stock: 7,
    rating: 4.8,
    reviewCount: 118,
  },
  {
    id: "coton-blanc",
    name: "Coton Blanc",
    brand: "Bee's Atelier",
    category: "unisex",
    price: 42000,
    image: p7,
    gallery: [p7, p5, p4],
    description:
      "Soft musks, neroli and a sun-warmed cotton accord. The scent of clean linen at noon.",
    notes: {
      top: ["Neroli", "Lemon"],
      heart: ["Cotton Accord", "Iris"],
      base: ["White Musk", "Cashmeran"],
    },
    stock: 30,
    rating: 4.5,
    reviewCount: 64,
  },
  {
    id: "nuit-violette",
    name: "Nuit Violette",
    brand: "Maison Bee",
    category: "women",
    price: 72000,
    image: p8,
    gallery: [p8, p6, p2],
    description: "Candied violet, dark berries and a ribbon of incense. A gothic romance.",
    notes: {
      top: ["Blackberry", "Violet Leaf"],
      heart: ["Violet", "Iris", "Heliotrope"],
      base: ["Incense", "Sandalwood"],
    },
    stock: 11,
    rating: 4.7,
    reviewCount: 89,
  },
];

export const brands = Array.from(new Set(products.map((p) => p.brand)));

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function relatedProducts(id: string, category: Category, limit = 4) {
  return products.filter((p) => p.id !== id && p.category === category).slice(0, limit);
}

export const naira = (n: number | string) => {
  const val = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(val || 0);
};
