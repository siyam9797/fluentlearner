/**
 * Shared building blocks for the /home-2 landing page.
 * Styles live in index.css under "Home v2".
 */
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Link } from "@/lib/router";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type ButtonVariant = "dark" | "red" | "outline" | "light" | "inverse" | "ghost";
type ButtonSize = "md" | "sm" | "xs";

/** The sliding label every v2 button uses: the text moves up and a copy slides in on hover. */
function HvButtonLabel({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span className="hv-btn-label">
      <span>
        {icon}
        {children}
      </span>
      <span aria-hidden="true">
        {icon}
        {children}
      </span>
    </span>
  );
}

const buttonClasses = (
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
) =>
  cn(
    "hv-btn",
    `hv-btn-${variant}`,
    size !== "md" && `hv-btn-${size}`,
    className
  );

/** A v2 button that navigates (internal link, external link or #anchor). */
export function HvButton({
  href,
  children,
  variant = "dark",
  size = "md",
  icon,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const classes = buttonClasses(variant, size, className);
  const label = <HvButtonLabel icon={icon}>{children}</HvButtonLabel>;
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
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}

/** A v2 button that runs an action — same look and hover as HvButton. */
export function HvActionButton({
  children,
  variant = "dark",
  size = "md",
  icon,
  className,
  type = "button",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      <HvButtonLabel icon={icon}>{children}</HvButtonLabel>
    </button>
  );
}

/** Round arrow; pass `href` to make it a link, omit it when a parent card is the link. */
export function ArrowButton({
  href,
  label,
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  const icons = (
    <>
      <ArrowRight className="w-4 h-4" />
      <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </>
  );
  if (!href)
    return (
      <span className={cn("hv-arrow", className)} aria-hidden="true">
        {icons}
      </span>
    );
  return (
    <Link href={href} aria-label={label} className={cn("hv-arrow", className)}>
      {icons}
    </Link>
  );
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
export function Pill({
  src,
  position = "50% 30%",
  zoom = "cover",
}: {
  src: string;
  position?: string;
  zoom?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="hv-pill"
      style={{
        backgroundImage: `url("${src}")`,
        backgroundPosition: position,
        backgroundSize: zoom,
      }}
    />
  );
}

/** Small red square used before category labels. */
export function DecorSquare({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block w-3 h-3 rounded-[2px] bg-brand-red shrink-0",
        className
      )}
    />
  );
}

/** Shared look for v2 text inputs, textareas and the HvSelect trigger, so every field matches. */
export const HV_FIELD =
  "w-full rounded-[var(--radius-control)] border border-ink/20 bg-white/60 px-4 py-3.5 text-base outline-none transition-colors placeholder:text-ink/40 hover:border-ink/50 focus:border-ink focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

export type HvSelectOption = {
  value: string;
  label: string;
  /** Options sharing a group are listed under its heading. */ group?: string;
};

export function HvSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  allowEmpty = true,
  disabled = false,
  size = "md",
  className,
  menuClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  options: HvSelectOption[];
  /** Shown when nothing is chosen; also the "clear" option unless allowEmpty is false. */
  placeholder: string;
  label: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  size?: "md" | "sm";
  className?: string;
  menuClassName?: string;
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

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const optionClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-3 rounded-[7px] px-3 py-3 text-left text-sm transition-colors hover:bg-sand",
      active && "bg-sand font-medium"
    );
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(current => !current)}
        className={cn(
          HV_FIELD,
          "flex items-center justify-between gap-4 text-left",
          size === "sm" && "px-3 py-2 text-sm",
          open && "border-ink bg-white hover:border-ink"
        )}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-ink/50")}>
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
          className={cn(
            "absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-[var(--radius-control)] border border-ink/15 bg-cream p-1.5 shadow-[0_18px_45px_rgba(31,31,31,0.12)]",
            menuClassName
          )}
        >
          {allowEmpty && (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => choose("")}
              className={optionClass(false)}
            >
              <span>{placeholder}</span>
              {!value && <Check className="h-4 w-4 text-brand-red" />}
            </button>
          )}
          {options.map((option, index) => (
            <div key={option.value}>
              {option.group && option.group !== options[index - 1]?.group && (
                <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-[0.1em] text-ink/45">
                  {option.group}
                </p>
              )}
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => choose(option.value)}
                className={optionClass(value === option.value)}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="h-4 w-4 shrink-0 text-brand-red" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Heading text with a round photo wherever the text says [img].
 * `positions` sets each photo's focal point; photos are taken from `pills` starting at `offset`.
 */
export function PillText({
  text,
  pills,
  offset = 0,
  positions = [],
}: {
  text: string;
  pills: string[];
  offset?: number;
  positions?: string[];
}) {
  const parts = text.split("[img]");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <Pill
              src={pills[(offset + i - 1) % pills.length]}
              position={positions[i - 1] ?? "50% 50%"}
            />
          )}
          {part}
        </span>
      ))}
    </>
  );
}

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 950 → "950", 10000 → "10K", 1250000 → "1.3M" */
export function formatCompact(value: number): string {
  return value >= 1000
    ? compactFormat.format(value)
    : value.toLocaleString("en-US");
}

/**
 * Full-width banner photo. Wide photos fill the frame; portrait or square photos are shown
 * whole over a blurred copy of themselves, so a head-and-shoulders shot is never cropped.
 */
export function BannerImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const measure = (img: HTMLImageElement | null) => {
    if (!img?.complete || !img.naturalWidth) return;
    setFit(img.naturalWidth / img.naturalHeight >= 1.6 ? "cover" : "contain");
  };

  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {fit === "contain" && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
        />
      )}
      <img
        src={src}
        alt={alt}
        // The ref covers images that finished loading before hydration, when onLoad never fires.
        ref={measure}
        onLoad={(e: SyntheticEvent<HTMLImageElement>) =>
          measure(e.currentTarget)
        }
        className={cn(
          "relative h-full w-full",
          fit === "cover"
            ? "object-cover object-[50%_40%]"
            : "object-contain object-bottom"
        )}
      />
    </div>
  );
}
