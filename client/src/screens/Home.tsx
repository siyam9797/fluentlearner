/**
 * Home Page — Fluent Learner Landing Page
 * FluentLearner Red+White Brand Theme
 * Restructured: Hero → TrustBar → SuccessTicker → Featured Courses Preview → About →
 * Featured Success Stories Preview → Testimonials → ComparisonTable → FAQ → CTA → UrgencyBanner → Footer
 */
import SEOHead, { PAGE_SEO } from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import SuccessTicker from "@/components/SuccessTicker";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ComparisonTable from "@/components/ComparisonTable";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import UrgencyBanner from "@/components/UrgencyBanner";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FeaturedCoursesPreview from "@/components/FeaturedCoursesPreview";
import FeaturedStoriesPreview from "@/components/FeaturedStoriesPreview";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead {...PAGE_SEO.home} />
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <SuccessTicker />
        <FeaturedCoursesPreview />
        <AboutSection />
        <FeaturedStoriesPreview />
        <TestimonialsSection />
        <ComparisonTable />
        <FAQSection />
        <CTASection />
        <UrgencyBanner />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
