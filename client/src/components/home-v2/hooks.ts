import { trpc } from "@/lib/trpc";
import { useV2Content } from "./useV2Content";
import {
  CATEGORY_LABELS,
  FALLBACK_COURSES,
  FALLBACK_STORIES,
  type CourseCard,
  type StoryCard,
} from "./data";

export function useCourseCards(): CourseCard[] {
  const { data } = trpc.courses.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  if (!data?.length) return FALLBACK_COURSES;
  return data.map(course => ({
    id: course.id,
    slug: course.slug,
    title: course.nameEn || course.name,
    description: course.shortDescription,
    label: CATEGORY_LABELS[course.category] ?? "Course",
    category: course.category,
    price: course.price,
    duration: course.duration,
    imageUrl: course.imageUrl,
  }));
}

export function useStoryCards(): StoryCard[] {
  const { data } = trpc.successStories.featured.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  if (!data?.length) return FALLBACK_STORIES;
  return data.map(story => ({
    id: story.id,
    name: story.studentName,
    band: story.bandScore,
    detail: story.courseName,
    imageUrl: story.thumbnailUrl || story.imageUrl,
    quote: story.testimonial,
  }));
}

/** Every active story (not just featured), for the success stories page. */
export function useAllStoryCards(): StoryCard[] {
  const { data } = trpc.successStories.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  if (!data?.length)
    return FALLBACK_STORIES.map(story => ({
      ...story,
      category: "ielts-score",
    }));
  return data.map(story => ({
    id: story.id,
    name: story.studentName,
    band: story.bandScore,
    detail: story.courseName,
    imageUrl: story.imageUrl,
    quote: story.testimonial,
    category: story.category,
    date: story.achievementDate,
  }));
}

/**
 * Photos for the small pills inside headings: the founder first, then course and story images.
 * Always returns at least four entries.
 */
export function usePillImages(): string[] {
  const ss = useV2Content();
  const courses = useCourseCards();
  const stories = useStoryCards();
  const pool = [
    ss.founderPhoto,
    ...courses.map(course => course.imageUrl),
    ...stories.map(story => story.imageUrl),
  ].filter((src): src is string => Boolean(src));
  const unique = pool.filter((src, i) => pool.indexOf(src) === i);
  while (unique.length < 4) unique.push(ss.founderPhoto);
  return unique;
}
