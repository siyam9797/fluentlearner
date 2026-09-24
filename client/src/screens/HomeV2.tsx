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

export default function HomeV2() {
  return (
    <HvLayout>
      {/* Canonical points at "/" so the two landing pages don't compete in search. */}
      <SEOHead {...PAGE_SEO.home} />
      <HvHero />
      <HvNumbers />
      <HvCourses />
      <HvBenefits />
      <HvAbout />
      <HvStories />
      <HvSteps />
      <HvTestimonials />
      <HvCTA />
    </HvLayout>
  );
}
