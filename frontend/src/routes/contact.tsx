import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bee's Perfumery" },
      {
        name: "description",
        content: "Reach the Bee's Perfumery atelier in Lagos. WhatsApp, email and store hours.",
      },
      { property: "og:title", content: "Contact Bee's Perfumery" },
      { property: "og:description", content: "Reach the Bee's Perfumery atelier in Lagos." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28 text-center">
          <p className="eyebrow text-gold">Get in Touch</p>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl">Contact the Maison</h1>
          <div className="gold-divider mx-auto mt-8" />
          <p className="mx-auto mt-8 max-w-xl text-muted-foreground">
            Questions about a fragrance, a private consultation, or a bespoke order? Our team in
            Lagos is here.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-16 md:grid-cols-[1fr_1.2fr] md:gap-24">
          {/* Info */}
          <div className="space-y-10">
            <Info
              icon={<MapPin className="h-5 w-5" />}
              title="Atelier"
              lines={["12 Marina Boulevard,", "Victoria Island, Lagos"]}
            />
            <Info
              icon={<Phone className="h-5 w-5" />}
              title="Phone"
              lines={["+234 810 327 3004"]}
            />
            <Info
              icon={<Mail className="h-5 w-5" />}
              title="Email"
              lines={["hello@beesperfumery.ng"]}
            />
            <Info
              icon={<Clock className="h-5 w-5" />}
              title="Hours"
              lines={["Mon — Sat · 10:00 — 19:00", "Sun · By appointment"]}
            />

            <a
              href="https://wa.me/2348103273004"
              className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-6 py-4 eyebrow text-gold hover:bg-gold hover:text-nude transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent", { description: "We'll respond within 24 hours." });
              (e.target as HTMLFormElement).reset();
            }}
            className="border border-border bg-card p-8 md:p-10"
          >
            <p className="eyebrow text-gold">Send a Message</p>
            <h2 className="mt-3 font-serif text-3xl">We&rsquo;d love to hear from you</h2>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Field label="Full name" required />
              <Field label="Email" type="email" required />
              <div className="md:col-span-2">
                <Field label="Subject" />
              </div>
              <div className="md:col-span-2">
                <label className="eyebrow block text-muted-foreground">
                  Message <span className="text-gold">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <button className="mt-8 w-full bg-foreground py-4 eyebrow text-background hover:bg-gold hover:text-nude transition-colors">
              Send Message
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}

function Info({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="flex gap-5">
      <span className="mt-1 grid h-10 w-10 place-items-center border border-gold/30 text-gold">
        {icon}
      </span>
      <div>
        <p className="eyebrow text-gold">{title}</p>
        <div className="mt-2 space-y-1 text-sm text-foreground">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="eyebrow block text-muted-foreground">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        className="mt-3 w-full border-b border-foreground/30 bg-transparent py-2 text-sm focus:border-gold focus:outline-none"
      />
    </div>
  );
}
