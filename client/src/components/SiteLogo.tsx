"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * The logo from Admin → Settings → Branding. "light" is the logo for light backgrounds
 * (Logo (light)), "dark" the one for dark backgrounds (Logo (dark)); each falls back to the
 * bundled logo. Hidden (keeping its space) until settings load, so the default never flashes.
 */
export default function SiteLogo({
  on = "light",
  className,
  alt = "FluentLearner",
}: {
  /** The background the logo sits on. */
  on?: "light" | "dark";
  className?: string;
  alt?: string;
}) {
  const { get, isLoading } = useSiteSettings();
  const src =
    on === "dark"
      ? get("logo_dark", "/logo-white.svg")
      : get("logo_light", "/logo.svg");
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={isLoading ? { visibility: "hidden" } : undefined}
    />
  );
}
