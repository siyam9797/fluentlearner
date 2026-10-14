"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CourseCard, StoryCard } from "@/components/home-v2/data";
import type { Course } from "@server/database/schema";
import type { PublicMetaConfig } from "@shared/meta";

export type PublicData = {
  courses: CourseCard[] | null;
  courseDetail: Course | null;
  featuredStories: StoryCard[] | null;
  allStories: StoryCard[] | null;
  settings: Record<string, string | null> | null;
  metaConfig: PublicMetaConfig;
};

const PublicDataContext = createContext<PublicData>({
  courses: null,
  courseDetail: null,
  featuredStories: null,
  allStories: null,
  settings: null,
  metaConfig: { enabled: false, datasetId: "" },
});

export function PublicDataProvider({
  value,
  children,
}: {
  value: PublicData;
  children: ReactNode;
}) {
  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData() {
  return useContext(PublicDataContext);
}
