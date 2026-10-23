import type { MetadataRoute } from "next";
import { getActiveCourses } from "@server/db";
import { siteUrl } from "./siteUrl";

export const revalidate = 3600;

const PAGES = [
  "/",
  "/courses",
  "/about",
  "/success-stories",
  "/how-it-works",
  "/contact",
  "/enroll",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const courses = (await getActiveCourses().catch(() => null)) ?? [];
  return [
    ...PAGES.map(path => ({ url: `${base}${path === "/" ? "" : path}` })),
    ...courses.map(course => ({
      url: `${base}/courses/${course.slug || course.id}`,
    })),
  ];
}
