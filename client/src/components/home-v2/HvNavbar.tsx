import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation } from "@/lib/router";
import { cn } from "@/lib/utils";
import { HvButton } from "./primitives";
import { V2 } from "./routes";
import { useV2Content } from "./useV2Content";
import type { V2MenuItem } from "./content";
import SiteLogo from "@/components/SiteLogo";

/** Menu entry as a router link, external link, or plain label when the URL is empty or "#". */
export function MenuLink({
  item,
  className,
  children,
}: {
  item: V2MenuItem;
  className?: string;
  children?: ReactNode;
}) {
  const content = children ?? item.label;
  if (!item.url || item.url === "#")
    return <span className={className}>{content}</span>;
  const href = item.url;
  if (item.newTab || /^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a
        href={href}
        className={className}
        {...(item.newTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function HvNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pathname] = useLocation();
  const c = useV2Content();
  const nav = c.menuAt("header");
  const isActive = (href: string) =>
    Boolean(href) &&
    href !== "#" &&
    (pathname === href || pathname.startsWith(`${href}/`));

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
        scrolled && "shadow-[0_1px_0_rgba(31,31,31,0.08)]"
      )}
    >
      <div className="mx-auto flex max-w-[1262px] items-center justify-between px-5 sm:px-8 py-3 lg:py-4">
        <Link
          href={V2.home}
          className="shrink-0"
          aria-label="FluentLearner home"
        >
          <SiteLogo className="h-10 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center" aria-label="Main">
          {nav.map(link => {
            const active =
              isActive(link.url) ||
              link.children.some(child => isActive(child.url));
            return (
              <div key={link.id} className="group relative">
                <MenuLink
                  item={link}
                  className={cn(
                    "relative flex items-center gap-1 px-5 py-2 text-base font-medium transition-colors hover:text-brand-red",
                    active && "text-brand-red"
                  )}
                >
                  {link.label}
                  {link.children.length > 0 && (
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-[1px] bg-brand-red"
                    />
                  )}
                </MenuLink>
                {link.children.length > 0 && (
                  <div className="invisible absolute left-2 top-full z-10 min-w-[220px] pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="rounded-[var(--radius-card)] bg-white p-2 shadow-[0_12px_32px_rgba(31,31,31,0.12)]">
                      {link.children.map(child => (
                        <MenuLink
                          key={child.id}
                          item={child}
                          className={cn(
                            "block rounded-[7px] px-3 py-2.5 text-[15px] transition-colors hover:bg-sand hover:text-brand-red",
                            isActive(child.url) && "text-brand-red"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <HvButton href={V2.enroll()} variant="outline" className="py-3">
            {c.t("v2_nav_enroll_text")}
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
          "lg:hidden overflow-y-auto border-t border-ink/10 transition-[max-height] duration-400",
          open ? "max-h-[80vh]" : "max-h-0 border-transparent"
        )}
      >
        <div className="px-5 pb-6 pt-2 sm:px-8">
          {nav.map(link => (
            <div key={link.id} className="border-b border-ink/10">
              <MenuLink
                item={link}
                className={cn(
                  "block py-3 text-lg font-medium",
                  isActive(link.url) && "text-brand-red"
                )}
              />
              {link.children.length > 0 && (
                <div className="pb-2 pl-4">
                  {link.children.map(child => (
                    <MenuLink
                      key={child.id}
                      item={child}
                      className={cn(
                        "block py-2 text-base text-ink/75",
                        isActive(child.url) && "text-brand-red"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          <HvButton href={V2.enroll()} variant="dark" className="mt-5 w-full">
            {c.t("v2_nav_enroll_text")}
          </HvButton>
        </div>
      </div>
    </header>
  );
}
