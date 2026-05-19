/**
 * SEOHead Component — Per-page Open Graph + Twitter Card + SEO meta tags
 * Uses react-helmet-async to dynamically set meta tags per route
 * 
 * Brand: FluentLearner IELTS & SPOKEN
 * Domain: https://fluentlearner.com
 * OG Images: CDN-hosted branded images
 */

import { Helmet } from "react-helmet-async";
import { SITE_STATS, CONTACT, BRAND } from "@/lib/siteConstants";

const BASE_URL = "https://fluentlearner.com";
const OG_DEFAULT = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/MSLFbmzRAjAzezbB.jpg";
const OG_SQUARE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663213348894/hOXAElMZLFNaGzeq.jpg";
const SITE_NAME = BRAND.NAME;

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogImageAlt?: string;
  type?: string;
}

export default function SEOHead({
  title = "FluentLearner - IELTS Coaching Platform (1-to-1 Mentorship)",
  description = `Expert-led IELTS preparation with one-to-one mentorship. Join ${SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ successful scorers across Bangladesh. Verified results & real proof.`,
  path = "/",
  ogImage = OG_DEFAULT,
  ogImageWidth = "1200",
  ogImageHeight = "630",
  ogImageAlt = "FluentLearner IELTS & Spoken - Your Path to IELTS Success",
  type = "website",
}: SEOHeadProps) {
  const fullUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content={ogImageWidth} />
      <meta property="og:image:height" content={ogImageHeight} />
      <meta property="og:image:alt" content={ogImageAlt} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
    </Helmet>
  );
}

// Pre-defined page SEO configs
export const PAGE_SEO = {
  home: {
    title: `${BRAND.NAME} - IELTS Coaching Platform (1-to-1 Mentorship)`,
    description: `Expert-led IELTS preparation with one-to-one mentorship. Join ${SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ successful scorers across Bangladesh. Verified results & real proof.`,
    path: "/",
  },
  courses: {
    title: `Our Courses - ${BRAND.NAME} | IELTS VIP, Speaking & Grammar`,
    description: `Choose from IELTS VIP Course (1-to-1), Basic Grammar & Spoken English, and IELTS Speaking Premium. Affordable pricing starting from ৳2,600.`,
    path: "/courses",
  },
  about: {
    title: `About ${BRAND.NAME} - Founder & 1-to-1 Mentorship Model`,
    description: `Founded by ${BRAND.FOUNDER}. Learn about our unique 1-to-1 mentorship approach that has helped ${SITE_STATS.TOTAL_SCORERS.toLocaleString()}+ students achieve their target IELTS band scores.`,
    path: "/about",
  },
  successStories: {
    title: `Success Stories - Verified IELTS Results | ${BRAND.NAME}`,
    description: "Real student results with verified IELTS band scores. From Band 7.0 to 8.5 — see how FluentLearner students achieved their dreams.",
    path: "/success-stories",
  },
  contact: {
    title: `Contact & Enroll - WhatsApp | ${BRAND.NAME}`,
    description: `Contact ${BRAND.NAME} via WhatsApp: ${CONTACT.PHONE_SHORT} or email: ${CONTACT.EMAIL}. Enroll now for the next IELTS batch.`,
    path: "/contact",
  },
  verify: {
    title: `Certificate Verification - ${BRAND.NAME}`,
    description: `Verify ${BRAND.NAME} course completion certificates. Enter your certificate ID to check authenticity and view detailed results.`,
    path: "/verify",
  },
};
