import { Link } from "@/lib/router";
import { ArrowButton, HvButton, Reveal } from "./primitives";
import { V2 } from "./routes";
import { useStoryCards } from "./hooks";

export default function HvStories() {
  const stories = useStoryCards().slice(0, 3);

  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-[1230px] px-4">
        <Reveal className="mb-10 flex items-end justify-between gap-8 lg:mb-14">
          <div className="flex max-w-[640px] flex-col gap-4">
            <h2 className="text-[32px] sm:text-[38px] lg:text-[44px]">
              Real students, verified band scores
            </h2>
            <p className="text-lg">
              Every result below is a real FluentLearner student who trusted us with their preparation
            </p>
          </div>
          <HvButton href={V2.stories} variant="outline" className="hidden md:inline-flex">All Success Stories</HvButton>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {stories.map((story, i) => (
            <Reveal key={story.id} delay={i * 120}>
              <Link href={V2.stories} className="group block">
                <div className="aspect-square overflow-hidden rounded-[5px] bg-sand">
                  <img
                    src={story.imageUrl}
                    alt={`${story.name}'s IELTS result`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-5 flex items-center justify-between gap-6">
                  <div>
                    <h3 className="text-[22px] transition-colors group-hover:text-brand-red">{story.name}</h3>
                    <p className="mt-1 text-ink/70">
                      {[story.band && `Band ${story.band}`, story.detail].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <ArrowButton />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <HvButton href={V2.stories} variant="outline" className="mt-10 w-full md:hidden">All Success Stories</HvButton>
      </div>
    </section>
  );
}
