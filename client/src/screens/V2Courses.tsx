/** v2 Courses page — /courses */
import { useMemo, useState } from "react";
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import { useV2Content } from "@/components/home-v2/useV2Content";
import { cn } from "@/lib/utils";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import { CourseItem } from "@/components/home-v2/HvCourses";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvCTA from "@/components/home-v2/HvCTA";
import { HvButton, Reveal } from "@/components/home-v2/primitives";
import { useCourseCards } from "@/components/home-v2/hooks";
import { CATEGORY_LABELS } from "@/components/home-v2/data";

export default function V2Courses() {
  const { t, on, whatsapp } = useV2Content();
  const courses = useCourseCards();
  const [filter, setFilter] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(courses.map(course => course.category))),
    [courses]
  );
  const visible =
    filter === "all"
      ? courses
      : courses.filter(course => course.category === filter);
  const adviceHref = whatsapp("v2_courses_advice_message");

  return (
    <HvLayout>
      <SEOHead
        {...PAGE_SEO.courses}
        title={t("v2_courses_seo_title")}
        description={t("v2_courses_seo_description")}
      />
      <HvPageHeader
        crumbs={[{ label: "Courses" }]}
        title={t("v2_courses_header_title")}
        description={t("v2_courses_header_description")}
      />

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto max-w-[1262px] px-5 sm:px-8">
          {categories.length > 1 && (
            <div
              className="mb-10 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter courses"
            >
              {["all", ...categories].map(key => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
                    filter === key
                      ? "border-ink bg-ink text-white"
                      : "border-ink/20 hover:border-ink"
                  )}
                >
                  {key === "all"
                    ? t("v2_courses_filter_all")
                    : (CATEGORY_LABELS[key] ?? key)}
                  <span
                    className={cn(
                      "ml-2",
                      filter === key ? "text-white/60" : "text-ink/40"
                    )}
                  >
                    {key === "all"
                      ? courses.length
                      : courses.filter(c => c.category === key).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-5">
            {visible.map((course, i) => (
              <Reveal key={course.id} delay={(i % 2) * 120} className="h-full">
                <CourseItem course={course} index={courses.indexOf(course)} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[var(--radius-card)] bg-ink p-8 text-cream md:flex-row md:items-center lg:mt-20 lg:p-12">
            <div className="max-w-[560px]">
              <h2 className="text-[28px] text-cream lg:text-[32px]">
                {t("v2_courses_advice_title")}
              </h2>
              <p className="mt-3 text-ash">{t("v2_courses_advice_text")}</p>
            </div>
            <HvButton href={adviceHref} variant="red" external>
              {t("v2_courses_advice_button")}
            </HvButton>
          </Reveal>
        </div>
      </section>

      {on("v2_courses_benefits_show") && <HvBenefits />}
      {on("v2_courses_cta_show") && <HvCTA />}
    </HvLayout>
  );
}
