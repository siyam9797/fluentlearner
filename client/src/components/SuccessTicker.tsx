/**
 * SuccessTicker — Psychological Trust Element
 * Auto-scrolling ticker showing real student achievements.
 * Cialdini's Social Proof: Creates "bandwagon effect" — others are succeeding, you can too.
 * Uses real student data from client's screenshots.
 */
import { useEffect, useRef, useState } from "react";
import { Trophy, Sparkles } from "lucide-react";

const successItems = [
  { name: "Dr Milon Chowdhury", band: "8.0", module: "Overall", highlight: true },
  { name: "Sajal Chaklader", band: "8.0", module: "Overall", highlight: true },
  { name: "Dr Afroza", band: "9.0", module: "Listening", highlight: true },
  { name: "Jian", band: "8.5", module: "Reading", highlight: false },
  { name: "Lailun Tonny", band: "8.5", module: "Reading", highlight: false },
  { name: "Ataur Rahman", band: "8.5", module: "Listening", highlight: false },
  { name: "Jannatul Ferdous Binti", band: "8.5", module: "Reading", highlight: false },
  { name: "Orko Rahman", band: "7.0", module: "Overall", highlight: false },
  { name: "Suprova Das Keya", band: "7.0", module: "Overall", highlight: false },
  { name: "Golam Imran", band: "7.0", module: "Overall", highlight: false },
  { name: "Sharmin Mishu", band: "7.0", module: "Overall", highlight: false },
  { name: "Nusrat Kabir", band: "7.0+", module: "Overall", highlight: false },
  { name: "Raihan Rahmatullah", band: "7.5", module: "Speaking", highlight: false },
  { name: "MD Safi", band: "8.5", module: "Listening", highlight: false },
  { name: "Mohana Kabir", band: "8.0", module: "Listening", highlight: false },
  { name: "Shakibur Rahman Joy", band: "8.0", module: "Reading", highlight: false },
];

export default function SuccessTicker() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    let scrollPos = 0;

    const animate = () => {
      if (!isPaused && el) {
        scrollPos += 0.5;
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
        el.scrollLeft = scrollPos;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Double the items for seamless loop
  const doubledItems = [...successItems, ...successItems];

  return (
    <section className="py-4 bg-brand-cream border-y border-gray-100 overflow-hidden">
      <div className="container mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-brand-charcoal/60 font-body text-xs uppercase tracking-widest font-semibold">
            Recent Achievements
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden cursor-default"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {doubledItems.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all ${
              item.highlight
                ? "bg-brand-red/5 border-brand-red/15"
                : "bg-white border-gray-100"
            }`}
          >
            {item.highlight ? (
              <Sparkles className="w-4 h-4 text-brand-red shrink-0" />
            ) : (
              <Trophy className="w-4 h-4 text-brand-red/60 shrink-0" />
            )}
            <span className="font-body text-sm text-brand-dark whitespace-nowrap">
              <strong className="font-display font-bold">{item.name}</strong>
              {" scored "}
              <span className={`font-display font-extrabold ${item.highlight ? "text-brand-red" : "text-brand-dark"}`}>
                {item.band}
              </span>
              {" in "}
              <span className="text-brand-charcoal/60">{item.module}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
