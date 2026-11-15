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
import { getPublicMetaConfig } from "@server/metaSettings";
import { META_DATASET_ID } from "@shared/meta";
import type { Metadata } from "next";
import {
  courseShareImagePath,
  findActiveCourse,
  SHARE_IMAGE,
} from "@server/courseShare";
import { siteUrl } from "../siteUrl";

/** Plain one-line text for a preview description (no tags, collapsed spaces, ~200 chars). */
function previewText(value: string | null | undefined) {
  const text = (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}

/**
 * Course pages get their share tags here, on the server, because link-preview crawlers
 * (WhatsApp, Facebook, LinkedIn…) read only the first HTML response. The image is the
 * course's featured image resized for previews (/og/course/…).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const path = (await params).path ?? [];
  if (path[0] !== "courses" || path.length !== 2) return {};
  const course = await findActiveCourse(decodeURIComponent(path[1])).catch(
    () => null
  );
  if (!course) return {};
  const base = siteUrl();
  const title = `${course.name} | FluentLearner`;
  const description =
    previewText(course.shortDescription) ||
    previewText(course.description) ||
    `${course.name} — FluentLearner IELTS coaching`;
  const url = `${base}/courses/${course.slug || course.id}`;
  const image = {
    url: `${base}${courseShareImagePath(course)}`,
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    type: "image/jpeg",
    alt: course.name,
  };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "FluentLearner",
      url,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const path = (await params).path ?? [];
  const firstSegment = path[0];
  const publicPage = firstSegment !== "admin" && firstSegment !== "student";
  const metaConfig = publicPage
    ? await getPublicMetaConfig().catch(() => ({
        enabled: false,
        capiEnabled: false,
        datasetId: META_DATASET_ID,
      }))
    : { enabled: false, capiEnabled: false, datasetId: META_DATASET_ID };
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
  const courseKey = path[0] === "courses" && path.length === 2 ? path[1] : null;
  const courseDetail =
    courseKey && rows
      ? (rows.find(course =>
          /^\d+$/.test(courseKey)
            ? course.id === Number(courseKey)
            : course.slug === courseKey
        ) ?? null)
      : null;
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
      courseDetail={courseDetail}
      featuredStories={featuredStories}
      allStories={allStories}
      settings={settings}
      metaConfig={metaConfig}
    />
  );
}
