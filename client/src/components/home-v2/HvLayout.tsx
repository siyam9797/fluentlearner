/**
 * Shell shared by every v2 page: font, navbar, footer and the floating WhatsApp button.
 */
import type { CSSProperties, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import HvNavbar from "./HvNavbar";
import HvFooter from "./HvFooter";
import { BannerImage, DecorSquare } from "./primitives";
import { V2 } from "./routes";
import { interTight } from "./font";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function HvLayout({ children }: { children: ReactNode }) {
  const { get } = useSiteSettings();
  const background = get("appearance_light_background", "#F8F7EC");
  return (
    <div className={`${interTight.variable} home-v2 min-h-screen`} style={{ "--color-cream": background, backgroundColor: background } as CSSProperties}>
      <HvNavbar />
      <main>{children}</main>
      <HvFooter />
      <WhatsAppButton />
    </div>
  );
}

/** Title block at the top of inner pages. */
export function HvPageHeader({
  title,
  description,
  crumbs,
  children,
  image,
  imageAlt = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Trail after "Home"; the last item is the current page. */
  crumbs: { label: string; href?: string }[];
  children?: ReactNode;
  image?: string;
  imageAlt?: string;
}) {
  const enter = "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both motion-reduce:animate-none";

  return (
    <section className="pt-32 lg:pt-44">
      <div className="mx-auto max-w-[1230px] px-4">
        <nav aria-label="Breadcrumb" className={cn("mb-6 flex flex-wrap items-center gap-2 text-sm text-ink/60 lg:mb-8", enter)}>
          <DecorSquare className="mr-1" />
          <Link href={V2.home} className="transition-colors hover:text-brand-red">Home</Link>
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              {crumb.href && i < crumbs.length - 1 ? (
                <Link href={crumb.href} className="transition-colors hover:text-brand-red">{crumb.label}</Link>
              ) : (
                <span aria-current="page" className="text-ink">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-16">
          <h1 className={cn("text-[40px] sm:text-[52px] lg:text-[64px]", enter)} style={{ animationDelay: "80ms" }}>
            {title}
          </h1>
          {(description || children) && (
            <div className={cn("flex flex-col items-start gap-6", enter)} style={{ animationDelay: "160ms" }}>
              {description && <p className="text-lg text-ink/75">{description}</p>}
              {children}
            </div>
          )}
        </div>
      </div>

      {image ? (
        <BannerImage src={image} alt={imageAlt} className="mt-14 h-[300px] sm:h-[380px] lg:mt-20 lg:h-[480px]" />
      ) : (
        <div className="mx-auto mt-14 max-w-[1230px] px-4 lg:mt-20">
          <div className="h-px bg-ink/15" />
        </div>
      )}
    </section>
  );
}
