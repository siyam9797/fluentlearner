/**
 * Site-wide constants for FluentLearner
 * Single source of truth for all stats, contact info, and brand data.
 * Update these values in ONE place and they propagate everywhere.
 */

// ============================================
// STATS — Must be consistent across all sections
// ============================================
export const SITE_STATS = {
  /** Total successful scorers (displayed as "10K+") */
  TOTAL_SCORERS: 10000,
  /** Success rate percentage (displayed as "95%") */
  SUCCESS_RATE: 95,
  /** Average band score (displayed as "7.0+") — stored as 70 for counter animation, divide by 10 */
  AVG_BAND_SCORE_RAW: 70,
  /** Average band score display string */
  AVG_BAND_SCORE: "7.0+",
  /** Years of experience */
  YEARS_EXPERIENCE: 6,
  /** Facebook followers */
  FACEBOOK_FOLLOWERS: "27K+",
} as const;

// ============================================
// CONTACT — WhatsApp Business + Phone + Email
// ============================================
export const CONTACT = {
  /** WhatsApp Business number (without +) for wa.me links */
  WHATSAPP_BUSINESS: "8801301872288",
  /** Phone display format */
  PHONE_DISPLAY: "+880 1301-872288",
  /** Phone short display */
  PHONE_SHORT: "01301-872288",
  /** Phone tel: link format */
  PHONE_TEL: "+8801301872288",
  /** Email */
  EMAIL: "fluentlearnerbd@gmail.com",
  /** Location */
  LOCATION: "Chittagong, Bangladesh",
} as const;

// ============================================
// BRAND — Names, URLs, Social
// ============================================
export const BRAND = {
  NAME: "FluentLearner",
  TAGLINE: "IELTS & SPOKEN",
  DOMAIN: "fluentlearner.com",
  FOUNDER: "MD Aditow Zahid",
  FOUNDER_TITLE: "Founder & Lead IELTS Mentor",
  FACEBOOK_URL: "https://www.facebook.com/fluentlearner",
  YOUTUBE_URL: "https://www.youtube.com/@FluentLearnerIELTS",
  TRAINER_PHOTO: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/wcPeWCfeDNIsXYhq.jpg",
} as const;

// ============================================
// PRICING — Course prices
// ============================================
export const PRICING = {
  VIP_1M: "৳8,500",
  VIP_2M: "৳10,000",
  GRAMMAR: "৳5,100",
  SPEAKING: "৳2,600",
  VIP_ORIGINAL: "৳12,000",
} as const;
