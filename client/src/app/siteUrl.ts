/** The public site's origin, e.g. https://fluentlearner.com (no trailing slash). */
export function siteUrl(): string {
  try {
    return new URL(process.env.PUBLIC_SITE_URL || "https://fluentlearner.com")
      .origin;
  } catch {
    return "https://fluentlearner.com";
  }
}
