/**
 * Every URL the v2 site links to. The v2 pages run beside the original site;
 * when v2 becomes permanent, change the paths here (and in App.tsx) only.
 */
export const V2 = {
  home: "/home-2",
  courses: "/v2/courses",
  course: (slugOrId: string | number) => `/v2/courses/${slugOrId}`,
  about: "/v2/about",
  stories: "/v2/success-stories",
  process: "/v2/how-it-works",
  contact: "/v2/contact",
  enroll: (courseId?: number) =>
    courseId && courseId > 0 ? `/v2/enroll?courseId=${courseId}` : "/v2/enroll",
} as const;

/** Links saved before v2 had its own enrol page point at "/enroll"; send those to the v2 page instead. */
export function toV2Href(href: string) {
  return href === "/enroll" || href.startsWith("/enroll?")
    ? `/v2${href}`
    : href;
}
