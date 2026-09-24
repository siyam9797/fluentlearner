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
  /** No v2 version yet — the original enrolment flow is reused. */
  enroll: (courseId?: number) => (courseId && courseId > 0 ? `/enroll?courseId=${courseId}` : "/enroll"),
} as const;

export const V2_NAV = [
  { label: "Courses", href: V2.courses },
  { label: "About", href: V2.about },
  { label: "Success Stories", href: V2.stories },
  { label: "How It Works", href: V2.process },
  { label: "Contact", href: V2.contact },
];
