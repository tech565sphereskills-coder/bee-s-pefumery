import { useEffect, useState } from "react";

export function EntranceLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("bees-splash");
    if (seen) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem("bees-splash", "1");
      setShow(false);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#120d14] text-[#f2e9f3] overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Simplified Logo Text */}
        <div className="flex flex-col items-center animate-pulse">
          <span className="font-serif text-3xl tracking-[0.45em] uppercase">Bee&rsquo;s</span>
          <span className="mt-2 h-px w-20 bg-[#B026B5]" />
          <span className="mt-2 text-[0.7rem] tracking-[0.6em] uppercase opacity-70">
            Perfumery
          </span>
        </div>

        <div className="mt-12 h-px w-40 overflow-hidden bg-white/10">
          <div className="h-full w-full bg-[#B026B5] animate-progress" />
        </div>
      </div>
      <style>{`
        @keyframes progress {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
