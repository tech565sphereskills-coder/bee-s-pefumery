import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  Sparkles,
  Truck,
  Award,
  ShieldCheck,
  Flower2,
  Volume2,
  VolumeX,
  ShieldQuestion,
  CreditCard,
  RotateCcw,
  Globe2,
  Droplets,
  Gem,
  Landmark,
  PenTool,
  MessageCircle,
} from "lucide-react";
import collectionMen from "@/assets/collection-men.jpg";
import collectionWomen from "@/assets/collection-women.jpg";
import collectionUnisex from "@/assets/collection-unisex.jpg";
import storyImg from "@/assets/brand-story.jpg";
import { products } from "@/data/products";
import { ProductCard } from "@/components/shop/product-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bee's Perfumery — Discover Your Signature Scent" },
      {
        name: "description",
        content:
          "A Nigerian luxury house of fragrance. Editorial scents for women, men and unisex — crafted in Lagos.",
      },
      { property: "og:title", content: "Bee's Perfumery — Discover Your Signature Scent" },
      { property: "og:description", content: "Editorial luxury fragrances, crafted in Lagos." },
    ],
  }),
  component: Home,
});

const HERO_VIDEO =
  "https://res.cloudinary.com/datom4le5/video/upload/v1777368932/tech565/bees_plpfzv.mp4";

const collections = [
  { key: "women", title: "Women", img: collectionWomen },
  { key: "men", title: "Men", img: collectionMen },
  { key: "unisex", title: "Unisex", img: collectionUnisex },
] as const;

const testimonials = [
  {
    quote:
      "Genuinely the best perfume I have ever owned. Delivered to my office in Lekki the next day, sealed and authentic. I am a customer for life.",
    name: "Adaora I.",
    location: "Lagos",
    product: "Amber Noir",
  },
  {
    quote:
      "I was nervous to order online but everything was perfect — the bottle, the box, the scent. No scam, no nonsense. My fiancé loves it on me.",
    name: "Tomide A.",
    location: "Abuja",
    product: "Rose de Lagos",
  },
  {
    quote:
      "Real luxury. The scent lasts the entire day and the packaging feels like something out of Paris. Bee's Perfumery is the real deal.",
    name: "Funke B.",
    location: "Port Harcourt",
    product: "Noir Impérial",
  },
  {
    quote:
      "Shipped to Kano in 4 days, well wrapped, original product. The fragrance turns heads — I get compliments every single time.",
    name: "Aisha M.",
    location: "Kano",
    product: "Miel Doré",
  },
];

const faqs = [
  {
    icon: ShieldQuestion,
    q: "Are your perfumes 100% authentic?",
    a: "Every fragrance is composed in our Lagos atelier or sourced directly from authorised partners. We will never sell counterfeits — your bottle is sealed and serialised.",
  },
  {
    icon: Truck,
    q: "How long does delivery take?",
    a: "Lagos: 1–2 working days. Other South-West & Abuja: 2–4 days. Rest of Nigeria: 3–7 days. You'll receive WhatsApp updates at every step.",
  },
  {
    icon: CreditCard,
    q: "Can I pay on delivery?",
    a: "Yes — within Lagos, Abuja and Port Harcourt. For other states we accept Paystack (cards, transfer, USSD) at checkout.",
  },
  {
    icon: RotateCcw,
    q: "What if the scent doesn't suit me?",
    a: "Unopened bottles can be exchanged within 7 days. We also offer free in-store consultations to help you find your signature scent.",
  },
  {
    icon: Globe2,
    q: "Do you ship outside Nigeria?",
    a: "Yes — we currently ship across West Africa and to the UK. Reach out via WhatsApp for an international quote.",
  },
  {
    icon: Droplets,
    q: "How long does the fragrance last?",
    a: "Most of our extraits and EDPs project for 8–12 hours, with a soft skin trail that lingers into the next day depending on your chemistry.",
  },
];

function Home() {
  const bestSellers = products.filter((p) => p.bestSeller);
  const [muted, setMuted] = useState(true);
  const [active, setActive] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const next = () => setActive((a) => (a + 1) % testimonials.length);
  const prev = () => setActive((a) => (a - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="flex flex-col w-full">
      {/* HERO SECTION */}
      <section className="relative h-svh w-full overflow-hidden bg-[#120d14]">
        <div className="absolute inset-0 z-0">
          <video
            src={HERO_VIDEO}
            autoPlay
            loop
            muted={muted}
            playsInline
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/80" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <div className="max-w-4xl">
            <p className="eyebrow text-white mb-6">Maison de Parfum — Lagos</p>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl text-white leading-tight mb-8">
              The Architecture of <em className="italic text-gold-soft">Scent</em>
            </h1>
            <p className="mx-auto max-w-md text-base md:text-lg text-white/90 mb-10">
              Rare compositions, slow craftsmanship, an unmistakable trail. Worn by those who arrive
              without announcement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="bg-gold text-white px-10 py-4 eyebrow hover:bg-gold-soft transition-all inline-flex items-center gap-2"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#collections"
                className="border border-white/40 text-white px-10 py-4 eyebrow hover:bg-white hover:text-black transition-all"
              >
                Explore Collections
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMuted((m) => !m)}
          className="absolute bottom-10 right-6 z-20 h-12 w-12 flex items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-sm hover:bg-gold transition-colors md:right-12"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <div className="absolute bottom-0 w-full z-10 border-t border-white/10 bg-black/40 backdrop-blur-md py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-2 px-5 text-[10px] tracking-[0.2em] uppercase text-white/70">
            <span className="flex items-center gap-2">
              <Award className="h-3 w-3 text-gold-soft" /> 100% Authentic
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-3 w-3 text-gold-soft" /> Nationwide Delivery
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-gold-soft" /> Pay on Delivery
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-gold-soft" /> Crafted in Lagos
            </span>
          </div>
        </div>
      </section>

      {/* HERITAGE & VALUES */}
      <section className="bg-[#f9f7f5] py-24 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm text-gold">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-black">Lagos Heritage</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-4">
                Born and crafted in the heart of Lagos, our scents are a tribute to the urban soul
                of Nigeria.
              </p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm text-gold">
                <PenTool className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-black">Artisan Alchemy</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-4">
                Slow-batched formulations using rare extraits and traditional distillation methods.
              </p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-sm text-gold">
                <Gem className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-black">Ethical Sourcing</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-4">
                We partner directly with sustainable growers to ensure the purest raw materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section id="collections" className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-gold mb-4">Featured Collections</p>
            <h2 className="font-serif text-4xl md:text-5xl text-black">A Library of Trails</h2>
            <div className="h-px w-16 bg-gold mx-auto mt-8" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.key}
                to="/shop"
                search={{ category: c.key }}
                className="group relative aspect-3/4 overflow-hidden bg-gray-100"
              >
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <p className="eyebrow text-gold mb-2">Collection</p>
                  <h3 className="font-serif text-3xl text-white">{c.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="bg-[#fdfbf9] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="eyebrow text-gold mb-4">Most Beloved</p>
              <h2 className="font-serif text-4xl md:text-5xl text-black">Best Sellers</h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-2 eyebrow text-black hover:text-gold transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {bestSellers.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED STORY / NEW ARRIVAL */}
      <section className="bg-noir py-24 md:py-32 text-nude overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-4/5 bg-gray-900 overflow-hidden">
                <img
                  src={storyImg}
                  alt="Amber Noir"
                  className="h-full w-full object-cover opacity-80"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 hidden lg:block w-64 aspect-square bg-gold p-1">
                <div className="w-full h-full border border-white/20 flex flex-col items-center justify-center text-center p-6">
                  <Sparkles className="h-8 w-8 mb-4 text-white" />
                  <p className="eyebrow text-[10px] text-white/80">New Arrival</p>
                  <h4 className="font-serif text-xl text-white">Amber Noir</h4>
                </div>
              </div>
            </div>
            <div className="space-y-10">
              <div>
                <p className="eyebrow text-gold mb-6">Fragrance Spotlight</p>
                <h2 className="font-serif text-5xl md:text-6xl text-white leading-tight">
                  The Art of <br />
                  Intimacy.
                </h2>
              </div>
              <p className="text-lg text-nude/70 leading-relaxed max-w-lg">
                Amber Noir is a deep, architectural composition designed for the late hours. A
                fusion of smoky oud, rare spiced amber, and the softest Nigerian sandalwood.
              </p>
              <div className="grid grid-cols-3 gap-8 pt-6 border-t border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Top</p>
                  <p className="text-sm">Black Pepper</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Heart</p>
                  <p className="text-sm">Damask Rose</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Base</p>
                  <p className="text-sm">Oud & Amber</p>
                </div>
              </div>
              <Link
                to="/shop"
                className="bg-gold text-white px-10 py-4 eyebrow hover:bg-gold-soft transition-all inline-flex items-center gap-2"
              >
                Pre-order Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="aspect-4/5 bg-gray-100 overflow-hidden">
            <img src={storyImg} alt="Story" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow text-gold mb-6">Our Story</p>
            <h2 className="font-serif text-4xl md:text-5xl text-black leading-tight mb-8">
              A scent is the most intimate thing you wear.
            </h2>
            <div className="h-px w-16 bg-gold mb-8" />
            <p className="text-base text-gray-600 leading-relaxed mb-10">
              Bee&rsquo;s Perfumery began in a Lagos studio with a single intention — to compose
              fragrances that feel personal rather than performative.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 eyebrow text-black hover:text-gold transition-colors"
            >
              Discover the Maison <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-noir py-24 md:py-32 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="eyebrow text-gold mb-12">Testimonials</p>
          <div className="min-h-[160px]">
            <figure key={active}>
              <blockquote className="font-serif text-2xl md:text-3xl italic leading-relaxed mb-8">
                &ldquo;{testimonials[active].quote}&rdquo;
              </blockquote>
              <figcaption>
                <p className="font-serif text-lg mb-1">{testimonials[active].name}</p>
                <p className="eyebrow text-gold">{testimonials[active].location}</p>
              </figcaption>
            </figure>
          </div>
          <div className="flex justify-center gap-6 mt-12">
            <button
              onClick={prev}
              className="h-12 w-12 flex items-center justify-center rounded-full border border-white/10 hover:bg-gold transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="h-12 w-12 flex items-center justify-center rounded-full border border-white/10 hover:bg-gold transition-all"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 md:px-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-gold mb-4">Frequently Asked</p>
            <h2 className="font-serif text-4xl text-black">Questions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {faqs.map((f, i) => (
              <div key={i} className="border border-gray-100 overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-all"
                >
                  <span className="font-serif text-lg text-black pr-4">{f.q}</span>
                  <div
                    className={cn(
                      "transition-transform duration-300 flex-none",
                      openFaq === i ? "rotate-180" : "",
                    )}
                  >
                    <ArrowRight className="h-4 w-4 rotate-90 text-gold" />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-500 text-sm leading-relaxed border-t border-gray-50/50 pt-4 bg-gray-50/30 animate-in fade-in slide-in-from-top-1 duration-300">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-[#f9f7f5] py-24">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-serif text-3xl text-black mb-4">Join the Inner Circle</h2>
          <p className="text-gray-500 mb-10">
            Receive exclusive early access to new releases, editorial content, and private events in
            Lagos.
          </p>
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-white border border-gray-200 px-6 py-4 eyebrow text-black focus:border-gold outline-none transition-colors"
            />
            <button className="bg-black text-white px-10 py-4 eyebrow hover:bg-gold transition-all">
              Subscribe
            </button>
          </form>
          <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-400">
            By subscribing, you agree to our Privacy Policy
          </p>
        </div>
      </section>
    </div>
  );
}
