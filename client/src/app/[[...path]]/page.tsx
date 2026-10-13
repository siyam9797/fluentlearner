import ClientApp from "@/ClientApp";
import {
  CATEGORY_LABELS,
  type CourseCard,
  type StoryCard,
} from "@/components/home-v2/data";
import {
  getActiveCourses,
  getActiveSuccessStories,
  getFeaturedSuccessStories,
} from "@server/db";
import { getPublicSiteSettings } from "@server/publicSiteSettings";

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const firstSegment = (await params).path?.[0];
  const publicPage = firstSegment !== "admin" && firstSegment !== "student";
  const [rows, settings, storyRows, featuredRows] = publicPage
    ? await Promise.all([
        getActiveCourses().catch(() => null),
        getPublicSiteSettings().catch(() => null),
        getActiveSuccessStories().catch(() => null),
        getFeaturedSuccessStories().catch(() => null),
      ])
    : [null, null, null, null];
  const courses: CourseCard[] | null =
    rows?.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.name,
      subtitle:
        course.nameEn && course.nameEn !== course.name ? course.nameEn : null,
      description: course.shortDescription,
      label: CATEGORY_LABELS[course.category] ?? "Course",
      category: course.category,
      price: course.price,
      duration: course.duration,
      imageUrl: course.imageUrl,
    })) ?? null;
  const allStories: StoryCard[] | null =
    storyRows?.map(story => ({
      id: story.id,
      name: story.studentName,
      band: story.bandScore,
      detail: story.courseName,
      imageUrl: story.imageUrl,
      quote: story.testimonial,
      category: story.category,
      date: story.achievementDate,
    })) ?? null;
  const featuredStories: StoryCard[] | null =
    featuredRows?.map(story => ({
      id: story.id,
      name: story.studentName,
      band: story.bandScore,
      detail: story.courseName,
      imageUrl: story.thumbnailUrl || story.imageUrl,
      quote: story.testimonial,
    })) ?? null;

  return (
    <ClientApp
      courses={courses}
      featuredStories={featuredStories}
      allStories={allStories}
      settings={settings}
    />
  );
}
