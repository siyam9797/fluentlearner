/**
 * Home v2 — alternate landing page served at /home-2.
 * Layout modelled on the Drivora template (cream canvas, Inter Tight)
 * with FluentLearner content and brand red. The original landing page at "/" is unchanged.
 */
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import HvLayout from "@/components/home-v2/HvLayout";
import HvHero from "@/components/home-v2/HvHero";
import HvNumbers from "@/components/home-v2/HvNumbers";
import HvCourses from "@/components/home-v2/HvCourses";
import HvBenefits from "@/components/home-v2/HvBenefits";
import HvAbout from "@/components/home-v2/HvAbout";
import HvStories from "@/components/home-v2/HvStories";
import HvSteps from "@/components/home-v2/HvSteps";
import HvTestimonials from "@/components/home-v2/HvTestimonials";
import HvCTA from "@/components/home-v2/HvCTA";
import { useV2Content } from "@/components/home-v2/useV2Content";

export default function HomeV2() {
  const { t, on } = useV2Content();
  return (
    <HvLayout>
      {/* Canonical points at "/" so the two landing pages don't compete in search. */}
      <SEOHead
        {...PAGE_SEO.home}
        title={t("v2_home_seo_title")}
        description={t("v2_home_seo_description")}
      />
      <HvHero />
      {on("v2_home_numbers_show") && <HvNumbers />}
      {on("v2_home_courses_show") && <HvCourses />}
      {on("v2_home_benefits_show") && <HvBenefits />}
      {on("v2_home_about_show") && <HvAbout />}
      {on("v2_home_stories_show") && <HvStories />}
      {on("v2_home_steps_show") && <HvSteps />}
      {on("v2_home_testimonials_show") && <HvTestimonials />}
      {on("v2_home_cta_show") && <HvCTA />}
    </HvLayout>
  );
}
