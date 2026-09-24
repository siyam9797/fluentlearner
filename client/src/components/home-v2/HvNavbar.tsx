import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import { HvButton } from "./primitives";
import { V2, V2_NAV } from "./routes";

export default function HvNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pathname] = useLocation();
  const ss = useSiteSettings();
  const consultHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I would like a free IELTS consultation.")}`;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-cream transition-shadow duration-300",
        scrolled && "shadow-[0_1px_0_rgba(31,31,31,0.08)]",
      )}
    >
      <div className="mx-auto flex max-w-[1230px] items-center justify-between px-4 py-3 lg:py-4">
        <Link href={V2.home} className="shrink-0" aria-label="FluentLearner home">
          <img src="/logo.svg" alt="FluentLearner" className="h-10 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center" aria-label="Main">
          {V2_NAV.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative px-5 py-2 text-base font-medium transition-colors hover:text-brand-red",
                isActive(link.href) && "text-brand-red",
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-[1px] bg-brand-red" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <HvButton href={consultHref} variant="outline" external className="py-3">
            Free Consultation
          </HvButton>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 -mr-2"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="hv-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div
        id="hv-mobile-menu"
        className={cn(
          "lg:hidden overflow-hidden border-t border-ink/10 transition-[max-height] duration-400",
          open ? "max-h-[520px]" : "max-h-0 border-transparent",
        )}
      >
        <div className="px-4 pb-6 pt-2">
          {V2_NAV.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("block border-b border-ink/10 py-3 text-lg font-medium", isActive(link.href) && "text-brand-red")}
            >
              {link.label}
            </Link>
          ))}
          <HvButton href={V2.enroll()} variant="dark" className="mt-5 w-full">Enroll Now</HvButton>
        </div>
      </div>
    </header>
  );
}
