import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/siteConstants";

/** A reusable instructor profile that courses can pick from. */
export type Instructor = {
  id: string;
  name: string;
  photo: string;
  bio: string;
};

const SETTING_KEY = "instructors";

type Settings = Record<string, string | null> | undefined;

/** Until the list is saved for the first time, it starts with the founder. */
function founderInstructor(settings: Settings): Instructor {
  const name = settings?.founder_name || BRAND.FOUNDER;
  return {
    id: "founder",
    name,
    photo: settings?.founder_photo || BRAND.TRAINER_PHOTO,
    bio:
      settings?.founder_bio ||
      `${name} leads every FluentLearner programme personally. Years of one-to-one mentoring have shaped a teaching method that is practical, structured and focused on what actually moves a band score.`,
  };
}

function parseInstructors(settings: Settings): Instructor[] {
  const raw = settings?.[SETTING_KEY];
  if (!raw) return [founderInstructor(settings)];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [founderInstructor(settings)];
    return parsed
      .filter(item => item && typeof item === "object" && item.name)
      .map((item, i) => ({
        id: String(item.id ?? `instructor-${i}`),
        name: String(item.name),
        photo: String(item.photo ?? ""),
        bio: String(item.bio ?? ""),
      }));
  } catch {
    return [founderInstructor(settings)];
  }
}

/** The saved instructor list, plus a way to replace it. */
export function useInstructors() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.siteSettings.getAll.useQuery();
  const update = trpc.siteSettings.update.useMutation();
  const instructors = parseInstructors(settings);

  const save = async (next: Instructor[]) => {
    await update.mutateAsync([
      {
        key: SETTING_KEY,
        value: JSON.stringify(next),
        type: "json",
        group: "instructors",
        label: "Instructors",
      },
    ]);
    await utils.siteSettings.getAll.invalidate();
  };

  return { instructors, isLoading, save, saving: update.isPending };
}

export const newInstructorId = () =>
  `instructor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
