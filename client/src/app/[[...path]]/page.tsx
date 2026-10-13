import ClientApp from "@/ClientApp";
import { CATEGORY_LABELS, type CourseCard } from "@/components/home-v2/data";
import { getActiveCourses } from "@server/db";
import { getPublicSiteSettings } from "@server/publicSiteSettings";

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const firstSegment = (await params).path?.[0];
  const publicPage = firstSegment !== "admin" && firstSegment !== "student";
  const [rows, settings] = publicPage
    ? await Promise.all([
        getActiveCourses().catch(() => null),
        getPublicSiteSettings().catch(() => null),
      ])
    : [null, null];
  const courses: CourseCard[] | null = rows?.map(course => ({
    id: course.id,
    slug: course.slug,
    title: course.nameEn || course.name,
    description: course.shortDescription,
    label: CATEGORY_LABELS[course.category] ?? "Course",
    category: course.category,
    price: course.price,
    duration: course.duration,
    imageUrl: course.imageUrl,
  })) ?? null;

  return <ClientApp courses={courses} settings={settings} />;
}
