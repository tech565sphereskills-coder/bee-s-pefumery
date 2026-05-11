import { Link } from "@tanstack/react-router";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-nude" : "text-noir";
  return (
    <Link to="/" className={`inline-flex flex-col items-center leading-none ${color}`}>
      <span className="font-display text-[1.35rem] font-bold tracking-[0.34em] uppercase drop-shadow-sm">
        Bee&rsquo;s
      </span>
      <span className="mt-1.5 h-[2px] w-12 bg-gold" />
      <span className="font-display mt-1.5 text-[0.72rem] font-semibold tracking-[0.5em] uppercase">
        Perfumery
      </span>
    </Link>
  );
}
