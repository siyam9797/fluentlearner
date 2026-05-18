import { trpc } from "@/lib/trpc";
import { SITE_STATS, CONTACT, BRAND } from "@/lib/siteConstants";

/**
 * Hook to get site settings from DB with fallback to hardcoded constants.
 * Usage: const { get, isLoading } = useSiteSettings();
 *        const heroTitle = get("hero_title", "Default Title");
 */
export function useSiteSettings() {
  const { data, isLoading } = trpc.siteSettings.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const get = (key: string, fallback: string = ""): string => {
    if (data && data[key]) return data[key]!;
    return fallback;
  };

  const getNumber = (key: string, fallback: number): number => {
    if (data && data[key]) {
      const n = Number(data[key]);
      return isNaN(n) ? fallback : n;
    }
    return fallback;
  };

  // Convenience getters with built-in fallbacks from siteConstants
  return {
    get,
    getNumber,
    isLoading,
    raw: data,

    // Hero
    heroTitle: get("hero_title", "Your Path to IELTS Success"),
    heroSubtitle: get("hero_subtitle", "আপনার IELTS সাফল্যের নির্ভরযোগ্য সঙ্গী"),
    heroDescription: get("hero_description", "Expert-led IELTS preparation with one-to-one mentorship — trusted by 5,129+ successful scorers across Bangladesh."),
    heroImage: get("hero_image", ""),
    heroCtaText: get("hero_cta_text", "এখনই ভর্তি হন"),
    heroCtaLink: get("hero_cta_link", "/enroll"),

    // Stats
    totalScorers: getNumber("stat_total_scorers", SITE_STATS.TOTAL_SCORERS),
    successRate: getNumber("stat_success_rate", SITE_STATS.SUCCESS_RATE),
    avgBandScore: get("stat_avg_band", SITE_STATS.AVG_BAND_SCORE),
    yearsExperience: getNumber("stat_years_experience", SITE_STATS.YEARS_EXPERIENCE),
    facebookFollowers: get("stat_facebook_followers", SITE_STATS.FACEBOOK_FOLLOWERS),

    // About
    aboutTitle: get("about_title", "আমাদের সম্পর্কে"),
    aboutDescription: get("about_description", ""),
    aboutImage: get("about_image", ""),
    aboutMission: get("about_mission", ""),
    aboutVision: get("about_vision", ""),

    // Founder
    founderName: get("founder_name", BRAND.FOUNDER),
    founderTitle: get("founder_title", BRAND.FOUNDER_TITLE),
    founderPhoto: get("founder_photo", BRAND.TRAINER_PHOTO),
    founderBio: get("founder_bio", ""),

    // Contact
    contactPhone: get("contact_phone", CONTACT.PHONE_DISPLAY),
    contactEmail: get("contact_email", CONTACT.EMAIL),
    contactWhatsapp: get("contact_whatsapp", CONTACT.WHATSAPP_BUSINESS),
    contactAddress: get("contact_address", CONTACT.LOCATION),

    // Social
    socialFacebook: get("social_facebook", BRAND.FACEBOOK_URL),
    socialYoutube: get("social_youtube", BRAND.YOUTUBE_URL),
    socialInstagram: get("social_instagram", ""),

    // Footer
    footerText: get("footer_text", `© ${new Date().getFullYear()} FluentLearner. All rights reserved.`),
    footerTagline: get("footer_tagline", "আপনার IELTS সাফল্যের নির্ভরযোগ্য সঙ্গী"),
  };
}
