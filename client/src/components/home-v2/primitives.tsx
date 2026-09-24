/**
 * Shared building blocks for the /home-2 landing page.
 * Styles live in index.css under "Home v2".
 */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Link } from "@/lib/router";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type ButtonVariant = "dark" | "red" | "outline" | "light" | "inverse";

export function HvButton({
  href,
  children,
  variant = "dark",
  external,
  className,
}: {
  href: string;
  children: string;
  variant?: ButtonVariant;
  external?: boolean;
  className?: string;
}) {
  const classes = cn("hv-btn", `hv-btn-${variant}`, className);
  const label = (
    <span className="hv-btn-label">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
  if (external || href.startsWith("#") || href.startsWith("http")) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {label}
      </a>
    );
  }
  return <Link href={href} className={classes}>{label}</Link>;
}

/** Round arrow; pass `href` to make it a link, omit it when a parent card is the link. */
export function ArrowButton({ href, label, className }: { href?: string; label?: string; className?: string }) {
  const icons = (
    <>
      <ArrowRight className="w-4 h-4" />
      <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </>
  );
  if (!href) return <span className={cn("hv-arrow", className)} aria-hidden="true">{icons}</span>;
  return <Link href={href} aria-label={label} className={cn("hv-arrow", className)}>{icons}</Link>;
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isVisible } = useScrollAnimation(0.12);
  return (
    <div
      ref={ref}
      className={cn("hv-reveal", isVisible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Rounded photo placed inline inside a heading. */
export function Pill({ src, position = "50% 30%", zoom = "cover" }: { src: string; position?: string; zoom?: string }) {
  return (
    <span
      aria-hidden="true"
      className="hv-pill"
      style={{ backgroundImage: `url("${src}")`, backgroundPosition: position, backgroundSize: zoom }}
    />
  );
}

/** Small red square used before category labels. */
export function DecorSquare({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block w-3 h-3 rounded-[2px] bg-brand-red shrink-0", className)} />;
}

export function HvSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-[5px] border bg-white/60 px-4 py-3.5 text-left text-base outline-none transition-colors",
          open
            ? "border-ink bg-white"
            : "border-ink/20 hover:border-ink/50"
        )}
      >
        <span className={selected ? "text-ink" : "text-ink/50"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180 text-brand-red"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-[5px] border border-ink/15 bg-cream p-1.5 shadow-[0_18px_45px_rgba(31,31,31,0.12)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between gap-3 rounded-[3px] px-3 py-3 text-left text-sm transition-colors hover:bg-sand"
          >
            <span>{placeholder}</span>
            {!value && <Check className="h-4 w-4 text-brand-red" />}
          </button>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-[3px] px-3 py-3 text-left text-sm transition-colors hover:bg-sand",
                value === option.value && "bg-sand font-medium"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-brand-red" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 950 → "950", 10000 → "10K", 1250000 → "1.3M" */
export function formatCompact(value: number): string {
  return value >= 1000 ? compactFormat.format(value) : value.toLocaleString("en-US");
}

/**
 * Full-width banner photo. Wide photos fill the frame; portrait or square photos are shown
 * whole over a blurred copy of themselves, so a head-and-shoulders shot is never cropped.
 */
export function BannerImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const measure = (img: HTMLImageElement | null) => {
    if (!img?.complete || !img.naturalWidth) return;
    setFit(img.naturalWidth / img.naturalHeight >= 1.6 ? "cover" : "contain");
  };

  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {fit === "contain" && (
        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" />
      )}
      <img
        src={src}
        alt={alt}
        // The ref covers images that finished loading before hydration, when onLoad never fires.
        ref={measure}
        onLoad={(e: SyntheticEvent<HTMLImageElement>) => measure(e.currentTarget)}
        className={cn(
          "relative h-full w-full",
          fit === "cover" ? "object-cover object-[50%_40%]" : "object-contain object-bottom",
        )}
      />
    </div>
  );
}
