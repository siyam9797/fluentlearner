"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CourseCard } from "@/components/home-v2/data";

export type PublicData = {
  courses: CourseCard[] | null;
  settings: Record<string, string | null> | null;
};

const PublicDataContext = createContext<PublicData>({
  courses: null,
  settings: null,
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
