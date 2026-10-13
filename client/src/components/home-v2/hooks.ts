import { trpc } from "@/lib/trpc";
import { useV2Content } from "./useV2Content";
import { usePublicData } from "@/contexts/PublicDataContext";
import {
  CATEGORY_LABELS,
  FALLBACK_STORIES,
  type CourseCard,
  type StoryCard,
} from "./data";

export function useCourseCardsState(): {
  courses: CourseCard[];
  ready: boolean;
} {
  const { courses: initialCourses } = usePublicData();
  const { data } = trpc.courses.list.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 60 * 1000,
  });
  const courses =
    data?.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.nameEn || course.name,
      description: course.shortDescription,
      label: CATEGORY_LABELS[course.category] ?? "Course",
      category: course.category,
      price: course.price,
      duration: course.duration,
      imageUrl: course.imageUrl,
    })) ??
    initialCourses ??
    [];
  return { courses, ready: data !== undefined || initialCourses !== null };
}

export function useCourseCards(): CourseCard[] {
  return useCourseCardsState().courses;
}

export function useStoryCardsState(): { stories: StoryCard[]; ready: boolean } {
  const { featuredStories } = usePublicData();
  const { data, isError } = trpc.successStories.featured.useQuery(undefined, {
    staleTime: 0,
  });
  const ready = data !== undefined || featuredStories !== null || isError;
  const stories =
    data?.map(story => ({
      id: story.id,
      name: story.studentName,
      band: story.bandScore,
      detail: story.courseName,
      imageUrl: story.thumbnailUrl || story.imageUrl,
      quote: story.testimonial,
    })) ??
    featuredStories ??
    [];
  return {
    stories: ready && stories.length === 0 ? FALLBACK_STORIES : stories,
    ready,
  };
}

export function useStoryCards(): StoryCard[] {
  return useStoryCardsState().stories;
}

/** Every active story (not just featured), for the success stories page. */
export function useAllStoryCards(): StoryCard[] {
  const { allStories } = usePublicData();
  const { data, isError } = trpc.successStories.list.useQuery(undefined, {
    staleTime: 0,
  });
  if (!data && allStories?.length) return allStories;
  if (!data && !allStories && !isError) return [];
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
  const { courses, ready: coursesReady } = useCourseCardsState();
  const { stories, ready: storiesReady } = useStoryCardsState();
  const pool = [
    ss.founderPhoto,
    ...courses.map(course => course.imageUrl),
    ...stories.map(story => story.imageUrl),
  ].filter((src): src is string => Boolean(src));
  if (ss.isLoading || !coursesReady || !storiesReady) return [];
  const unique = pool.filter((src, i) => pool.indexOf(src) === i);
  while (unique.length < 4) unique.push(ss.founderPhoto);
  return unique;
}
