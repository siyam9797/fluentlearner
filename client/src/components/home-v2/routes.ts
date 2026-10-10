/**
 * Every URL the v2 site (the current site) links to. The old v1 site lives under /old (see App.tsx).
 */
export const V2 = {
  home: "/",
  courses: "/courses",
  course: (slugOrId: string | number) => `/courses/${slugOrId}`,
  about: "/about",
  stories: "/success-stories",
  process: "/how-it-works",
  contact: "/contact",
  enroll: (courseId?: number) =>
    courseId && courseId > 0 ? `/enroll?courseId=${courseId}` : "/enroll",
} as const;

/** Links saved while v2 ran beside v1 point at "/home-2" or "/v2/..."; send those to the current paths. */
export function toV2Href(href: string) {
  if (href === "/home-2") return "/";
  return href.startsWith("/v2/") ? href.slice(3) : href;
}
