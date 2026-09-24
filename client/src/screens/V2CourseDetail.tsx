/** v2 Course detail page — /v2/courses/:slug (slug or numeric id) */
import { BookOpen, CalendarClock, Check, Clock, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/lib/router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import HvLayout, { HvPageHeader } from "@/components/home-v2/HvLayout";
import HvAccordion from "@/components/home-v2/HvAccordion";
import HvCTA from "@/components/home-v2/HvCTA";
import { DecorSquare, HvButton, Reveal } from "@/components/home-v2/primitives";
import { CATEGORY_LABELS } from "@/components/home-v2/data";
import { V2 } from "@/components/home-v2/routes";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All levels",
};

function toEmbedUrl(url: string) {
  return url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/").replace(/&.*$/, "");
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-6 flex items-center gap-3 text-[26px] lg:text-[30px]">
      <DecorSquare />
      {children}
    </h2>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <span className="text-lg">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function V2CourseDetail() {
  const [pathname] = useLocation();
  const ss = useSiteSettings();
  const slug = decodeURIComponent(pathname.split("/")[3] ?? "");
  const isId = /^\d+$/.test(slug);

  const bySlug = trpc.courses.getBySlug.useQuery({ slug }, { enabled: !isId && !!slug });
  const byId = trpc.courses.getById.useQuery({ id: Number(slug) }, { enabled: isId });
  const { data: course, isLoading } = isId ? byId : bySlug;

  if (isLoading) {
    return (
      <HvLayout>
        <div className="flex min-h-[70vh] items-center justify-center pt-24" role="status">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <span className="sr-only">Loading course</span>
        </div>
      </HvLayout>
    );
  }

  if (!course) {
    return (
      <HvLayout>
        <HvPageHeader
          crumbs={[{ label: "Courses", href: V2.courses }, { label: "Not found" }]}
          title="This course isn't available"
          description="It may have been renamed or is no longer offered. Browse our current courses instead."
        >
          <HvButton href={V2.courses} variant="dark">View All Courses</HvButton>
        </HvPageHeader>
        <div className="pb-24" />
      </HvLayout>
    );
  }

  const title = course.nameEn || course.name;
  const features = course.features ?? [];
  const outcomes = course.learningOutcomes ?? [];
  const curriculum = course.curriculum ?? [];
  const faqs = course.courseFaq ?? [];
  const seatsLeft = course.maxStudents ? Math.max(0, course.maxStudents - (course.enrolledCount ?? 0)) : null;
  const whatsappHref = `https://wa.me/${ss.contactWhatsapp}?text=${encodeURIComponent(
    course.enrollMessage || `I would like to learn more about the "${title}" course.`,
  )}`;

  const facts = [
    { icon: BookOpen, label: "Level", value: LEVEL_LABELS[course.level] ?? null },
    { icon: Clock, label: "Duration", value: course.duration },
    { icon: CalendarClock, label: "Schedule", value: course.schedule },
    { icon: Users, label: "Batch size", value: course.maxStudents ? `Up to ${course.maxStudents} students` : null },
  ].filter(fact => fact.value);

  return (
    <HvLayout>
      <SEOHead
        title={`${title} | FluentLearner`}
        description={course.shortDescription || course.description || `${title} — FluentLearner IELTS coaching`}
        path={`/courses/${course.slug || course.id}`}
        ogImage={course.imageUrl || undefined}
        type="article"
      />
      <HvPageHeader
        crumbs={[{ label: "Courses", href: V2.courses }, { label: title }]}
        title={title}
        description={course.shortDescription}
      >
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-red px-4 py-1.5 text-sm font-medium text-white">
            {CATEGORY_LABELS[course.category] ?? "Course"}
          </span>
          {course.badge && (
            <span className="rounded-full border border-ink/20 px-4 py-1.5 text-sm font-medium">{course.badge}</span>
          )}
        </div>
      </HvPageHeader>

      <section className="pb-20 pt-12 lg:pb-32 lg:pt-16">
        <div className="mx-auto grid max-w-[1230px] gap-12 px-4 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-14 lg:gap-16">
            {course.videoUrl ? (
              <div className="aspect-video overflow-hidden rounded-[5px] bg-ink">
                <iframe
                  src={toEmbedUrl(course.videoUrl)}
                  title={`${title} introduction video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : course.imageUrl ? (
              <img src={course.imageUrl} alt={`${title} course`} className="aspect-[16/9] w-full rounded-[5px] object-cover" />
            ) : null}

            {facts.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[5px] bg-ink/15 md:grid-cols-4">
                {facts.map(fact => (
                  <div key={fact.label} className="flex flex-col gap-2 bg-sand p-5">
                    <dt className="flex items-center gap-2 text-sm text-ink/60">
                      <fact.icon className="h-4 w-4" aria-hidden="true" />
                      {fact.label}
                    </dt>
                    <dd className="font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {(course.fullDescription || course.description) && (
              <Reveal>
                <SectionTitle>About this course</SectionTitle>
                <div className="whitespace-pre-line text-lg leading-relaxed text-ink/80">
                  {course.fullDescription || course.description}
                </div>
              </Reveal>
            )}

            {outcomes.length > 0 && (
              <Reveal>
                <SectionTitle>What you'll learn</SectionTitle>
                <CheckList items={outcomes} />
              </Reveal>
            )}

            {curriculum.length > 0 && (
              <Reveal>
                <SectionTitle>Curriculum</SectionTitle>
                <HvAccordion
                  numbered
                  items={curriculum.map(module => ({
                    title: module.title,
                    body: <p className="whitespace-pre-line">{module.content}</p>,
                  }))}
                />
              </Reveal>
            )}

            {course.targetAudience && (
              <Reveal>
                <SectionTitle>Who this course is for</SectionTitle>
                <p className="whitespace-pre-line text-lg leading-relaxed text-ink/80">{course.targetAudience}</p>
              </Reveal>
            )}

            {course.instructorName && (
              <Reveal className="flex flex-col gap-6 rounded-[5px] bg-ink p-6 text-cream sm:flex-row sm:items-center lg:p-8">
                {course.instructorPhoto && (
                  <img
                    src={course.instructorPhoto}
                    alt={course.instructorName}
                    className="h-24 w-24 flex-none rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-ash">Your mentor</p>
                  <h2 className="mt-1 text-2xl text-cream">{course.instructorName}</h2>
                  {course.instructorBio && <p className="mt-3 whitespace-pre-line text-ash">{course.instructorBio}</p>}
                </div>
              </Reveal>
            )}

            {faqs.length > 0 && (
              <Reveal>
                <SectionTitle>Frequently asked questions</SectionTitle>
                <HvAccordion
                  defaultOpen={null}
                  items={faqs.map(faq => ({ title: faq.question, body: <p className="whitespace-pre-line">{faq.answer}</p> }))}
                />
              </Reveal>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[5px] bg-brand-red p-6 text-white lg:p-8">
              <p className="text-sm text-white/75">Course fee</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[44px] font-semibold leading-none">{course.price || "Contact us"}</span>
                {course.originalPrice && <span className="text-lg text-white/60 line-through">{course.originalPrice}</span>}
              </div>
              {seatsLeft !== null && seatsLeft > 0 && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
                  {seatsLeft} seats left
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <HvButton href={V2.enroll(course.id)} variant="inverse" className="w-full">Enroll Now</HvButton>
                <HvButton href={whatsappHref} variant="light" external className="w-full">Ask on WhatsApp</HvButton>
              </div>

              {features.length > 0 && (
                <ul className="mt-8 flex flex-col gap-3 border-t border-white/20 pt-6">
                  {features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-white/90">
                      <Check className="mt-0.5 h-4 w-4 flex-none" strokeWidth={3} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>

      <HvCTA />
    </HvLayout>
  );
}
