/**
 * Every piece of editable v2 website content, grouped the way the admin "Website" page shows it.
 * The v2 pages read these through `useV2Content()`; the admin page renders its forms from them.
 *
 * Values live in `site_settings` under their `v2_*` key:
 * - no row / null → `legacyKey` value (shared with the original site) → `default`
 * - "" → deliberately left blank
 *
 * Text supports tokens: {scorers} {successRate} {avgBand} {years} {founder}
 * Headings that show round photos mark each photo position with [img].
 */
import { BRAND, CONTACT, SITE_STATS } from "@/lib/siteConstants";
import { V2 } from "./routes";

export type V2ListItemField = {
  name: string;
  label: string;
  /** "lines" is edited as a textarea and read as one item per line. */
  type?: "text" | "textarea" | "lines";
};

export type V2ListItem = Record<string, string>;

/** A menu entry, stored flat like WordPress: `depth` 1 nests it under the nearest item above at depth 0. */
export type V2MenuItem = {
  id: string;
  label: string;
  url: string;
  newTab?: boolean;
  depth: number;
};

/** A named menu, like a WordPress nav menu. */
export type V2Menu = { id: string; name: string; items: V2MenuItem[] };
/** Every menu plus which one each theme location shows (null = no menu). */
export type V2Menus = {
  menus: V2Menu[];
  locations: Record<string, string | null>;
};

/** Places in the v2 theme that can show a menu. */
export const V2_MENU_LOCATIONS = [
  {
    id: "header",
    label: "Header menu",
    description: "Main navigation at the top of every page",
  },
  {
    id: "footer",
    label: "Footer menu",
    description: "Links in the footer's first column (sub-items listed flat)",
  },
];

/** Pages offered in the menu editor's "Pages" panel. */
export const V2_MENU_PAGES = [
  { label: "Home", url: V2.home },
  { label: "Courses", url: V2.courses },
  { label: "About", url: V2.about },
  { label: "Success Stories", url: V2.stories },
  { label: "How It Works", url: V2.process },
  { label: "Contact", url: V2.contact },
  { label: "Enroll", url: V2.enroll() },
];

const menuItems = (...pages: string[]): V2MenuItem[] =>
  pages.map(label => {
    const page = V2_MENU_PAGES.find(p => p.label === label)!;
    return {
      id: `default-${label.toLowerCase().replace(/\s+/g, "-")}`,
      label: page.label,
      url: page.url,
      depth: 0,
    };
  });

type FieldBase = {
  key: string;
  label: string;
  help?: string;
  legacyKey?: string;
};

export type V2Field =
  | (FieldBase & {
      type: "text" | "textarea" | "image" | "url";
      default: string;
    })
  | (FieldBase & { type: "toggle"; default: boolean })
  | (FieldBase & {
      type: "list";
      default: V2ListItem[];
      itemFields: V2ListItemField[];
      itemLabel: string;
    })
  | (FieldBase & { type: "menus"; default: V2Menus });

export type V2Section = {
  id: string;
  page: string;
  title: string;
  description: string;
  /** Public page to open from the editor. */
  preview?: string;
  fields: V2Field[];
};

/** The pages listed on the admin Website → Pages screen; `title` matches each section's `page`. */
export const V2_PAGE_LIST: {
  slug: string;
  title: string;
  url: string;
  note?: string;
}[] = [
  { slug: "home", title: "Home", url: V2.home, note: "Front Page" },
  { slug: "about", title: "About", url: V2.about },
  { slug: "courses", title: "Courses", url: V2.courses },
  {
    slug: "course-detail",
    title: "Course detail",
    url: V2.courses,
    note: "Template",
  },
  { slug: "success-stories", title: "Success Stories", url: V2.stories },
  { slug: "how-it-works", title: "How It Works", url: V2.process },
  { slug: "contact", title: "Contact", url: V2.contact },
  { slug: "enroll", title: "Enroll", url: V2.enroll() },
];

const text = (
  key: string,
  label: string,
  value: string,
  extra: Partial<FieldBase> = {}
): V2Field => ({ key, label, type: "text", default: value, ...extra });
const area = (
  key: string,
  label: string,
  value: string,
  extra: Partial<FieldBase> = {}
): V2Field => ({ key, label, type: "textarea", default: value, ...extra });
const image = (
  key: string,
  label: string,
  value: string,
  extra: Partial<FieldBase> = {}
): V2Field => ({ key, label, type: "image", default: value, ...extra });
const url = (
  key: string,
  label: string,
  value: string,
  extra: Partial<FieldBase> = {}
): V2Field => ({ key, label, type: "url", default: value, ...extra });
const show = (key: string, label = "Show this section"): V2Field => ({
  key,
  label,
  type: "toggle",
  default: true,
});

const PILL_HELP =
  "Use [img] where a round photo should appear inside the heading.";
const TOKEN_HELP =
  "Tokens: {scorers} {successRate} {avgBand} {years} {founder}";
const WHATSAPP_HELP = "Pre-filled WhatsApp message.";

export const V2_SECTIONS: V2Section[] = [
  // ─────────────────────────── Site-wide ───────────────────────────
  {
    id: "menus",
    page: "Menus",
    title: "Menus",
    description: "Create menus and choose where they appear.",
    preview: "/",
    fields: [
      {
        key: "v2_menus",
        label: "Menus",
        type: "menus",
        // Header/footer menus saved before multiple menus existed are carried over by fallbackValue().
        default: {
          menus: [
            {
              id: "menu-header",
              name: "Header menu",
              items: menuItems(
                "Courses",
                "About",
                "Success Stories",
                "How It Works",
                "Contact"
              ),
            },
            {
              id: "menu-footer",
              name: "Footer menu",
              items: menuItems(
                "Home",
                "Courses",
                "About",
                "Success Stories",
                "How It Works",
                "Contact",
                "Enroll"
              ),
            },
          ],
          locations: { header: "menu-header", footer: "menu-footer" },
        },
      },
    ],
  },
  {
    id: "header-buttons",
    page: "Site-wide",
    title: "Header buttons",
    description:
      "Button beside the menu (and at the bottom of the mobile menu). It opens the enroll page.",
    preview: "/",
    fields: [text("v2_nav_enroll_text", "Header button", "Enroll Now")],
  },
  {
    id: "contact",
    page: "Site-wide",
    title: "Contact details",
    description:
      "Phone, email, WhatsApp and address shown in the footer, contact page and every WhatsApp button.",
    preview: "/contact",
    fields: [
      text("v2_contact_phone", "Phone number", CONTACT.PHONE_DISPLAY, {
        legacyKey: "contact_phone",
      }),
      text("v2_contact_email", "Email", CONTACT.EMAIL, {
        legacyKey: "contact_email",
      }),
      text(
        "v2_contact_whatsapp",
        "WhatsApp number",
        CONTACT.WHATSAPP_BUSINESS,
        {
          legacyKey: "contact_whatsapp",
          help: "Digits only, with country code — e.g. 8801301872288.",
        }
      ),
      area("v2_contact_address", "Address", CONTACT.LOCATION, {
        legacyKey: "contact_address",
      }),
    ],
  },
  {
    id: "social",
    page: "Site-wide",
    title: "Social media",
    description:
      "Links in the footer and on the contact page. Leave Instagram blank to hide it.",
    preview: "/contact",
    fields: [
      url("v2_social_facebook", "Facebook page URL", BRAND.FACEBOOK_URL, {
        legacyKey: "social_facebook",
      }),
      url("v2_social_youtube", "YouTube channel URL", BRAND.YOUTUBE_URL, {
        legacyKey: "social_youtube",
      }),
      url("v2_social_instagram", "Instagram URL", "", {
        legacyKey: "social_instagram",
      }),
    ],
  },
  {
    id: "stats",
    page: "Site-wide",
    title: "Statistics",
    description:
      "Figures used in counters and anywhere a {token} appears in text.",
    preview: "/",
    fields: [
      text(
        "v2_stat_total_scorers",
        "Successful students",
        String(SITE_STATS.TOTAL_SCORERS),
        {
          legacyKey: "stat_total_scorers",
          help: "A number, e.g. 10000 or 10K.",
        }
      ),
      text(
        "v2_stat_success_rate",
        "Success rate (%)",
        String(SITE_STATS.SUCCESS_RATE),
        { legacyKey: "stat_success_rate" }
      ),
      text(
        "v2_stat_avg_band",
        "Average band score",
        SITE_STATS.AVG_BAND_SCORE,
        { legacyKey: "stat_avg_band", help: "e.g. 7.0+" }
      ),
      text(
        "v2_stat_years_experience",
        "Years of experience",
        String(SITE_STATS.YEARS_EXPERIENCE),
        { legacyKey: "stat_years_experience" }
      ),
    ],
  },
  {
    id: "founder",
    page: "Site-wide",
    title: "Founder",
    description: "Mentor profile used on the home and about pages.",
    preview: "/about",
    fields: [
      text("v2_founder_name", "Name", BRAND.FOUNDER, {
        legacyKey: "founder_name",
      }),
      text("v2_founder_title", "Title", BRAND.FOUNDER_TITLE, {
        legacyKey: "founder_title",
      }),
      image("v2_founder_photo", "Photo", BRAND.TRAINER_PHOTO, {
        legacyKey: "founder_photo",
      }),
      area(
        "v2_founder_bio",
        "Biography",
        "{founder} leads every FluentLearner programme personally. Years of one-to-one mentoring have shaped a teaching method that is practical, structured and focused on what actually moves a band score.",
        { legacyKey: "founder_bio", help: TOKEN_HELP }
      ),
    ],
  },
  {
    id: "benefits",
    page: "Site-wide",
    title: "Benefits block",
    description:
      "Dark “Why our coaching” block shown on Home, About, Courses and How It Works.",
    preview: "/",
    fields: [
      text(
        "v2_benefits_title",
        "Heading",
        "Why our coaching[img]delivers real results for every student",
        { help: PILL_HELP }
      ),
      {
        key: "v2_benefits_items",
        label: "Benefits",
        type: "list",
        itemLabel: "Benefit",
        itemFields: [
          { name: "title", label: "Title" },
          { name: "text", label: "Text", type: "textarea" },
        ],
        default: [
          {
            title: "One-to-One Mentoring",
            text: "Every lesson is shaped around your level, your weak modules and your target band",
          },
          {
            title: "Mock Tests & Feedback",
            text: "Exam-style mock tests with detailed, band-descriptor based feedback after each one",
          },
          {
            title: "Theory & Practice Mix",
            text: "Learn the strategy for each question type, then apply it straight away with guided practice",
          },
          {
            title: "Support at Every Step",
            text: "Recorded classes, study materials and WhatsApp support from enrollment to exam day",
          },
        ],
      },
    ],
  },
  {
    id: "testimonials",
    page: "Site-wide",
    title: "Testimonials block",
    description:
      "Quote carousel on Home and Success Stories. Quotes come from success stories marked as featured.",
    preview: "/",
    fields: [text("v2_testimonials_label", "Label", "Testimonials")],
  },
  {
    id: "cta",
    page: "Site-wide",
    title: "Closing call to action",
    description: "“Ready to start” block at the bottom of every page.",
    preview: "/",
    fields: [
      text(
        "v2_cta_title",
        "Heading",
        "Ready to start your IELTS journey with us?"
      ),
      area(
        "v2_cta_description",
        "Description",
        "Book your seat and begin preparing with one-to-one mentoring, mock tests and support right up to exam day"
      ),
      show("v2_cta_show_batch", "Show next batch date and seats"),
      text("v2_cta_enroll_text", "Enroll button", "Enroll Now"),
      text("v2_cta_whatsapp_text", "WhatsApp button", "Chat on WhatsApp"),
      area(
        "v2_cta_whatsapp_message",
        "WhatsApp message",
        "Assalamu Alaikum, I want to start my IELTS preparation with FluentLearner.",
        { help: WHATSAPP_HELP }
      ),
    ],
  },
  {
    id: "footer",
    page: "Site-wide",
    title: "Footer",
    description: "Tagline, column headings and copyright line.",
    preview: "/",
    fields: [
      text(
        "v2_footer_tagline",
        "Tagline",
        "Your trusted partner for IELTS success",
        { legacyKey: "footer_tagline" }
      ),
      text("v2_footer_explore_title", "Menu column heading", "Explore", {
        help: "Links are edited under Website → Menus.",
      }),
      text("v2_footer_courses_title", "Courses column heading", "Courses"),
      text("v2_footer_contact_title", "Contact column heading", "Contact"),
      text(
        "v2_footer_text",
        "Copyright text",
        `© ${new Date().getFullYear()} FluentLearner. All rights reserved.`,
        { legacyKey: "footer_text" }
      ),
    ],
  },

  // ─────────────────────────── Home ───────────────────────────
  {
    id: "home-hero",
    page: "Home",
    title: "Hero",
    description: "Top banner of the home page.",
    preview: "/",
    fields: [
      text("v2_home_hero_title", "Title", "Your Path to IELTS Success", {
        legacyKey: "hero_title",
      }),
      area(
        "v2_home_hero_description",
        "Description",
        "Expert-led IELTS preparation with one-to-one mentorship — trusted by 10K+ successful scorers across Bangladesh.",
        { legacyKey: "hero_description", help: TOKEN_HELP }
      ),
      text("v2_home_hero_cta_text", "Button text", "Free Consultation"),
      area(
        "v2_home_hero_cta_message",
        "Button WhatsApp message",
        "Assalamu Alaikum, I would like a free IELTS consultation.",
        { help: WHATSAPP_HELP }
      ),
      image("v2_home_hero_avatar_1", "Student photo 1", "", {
        help: "Small round photos beside the button. Use square head-and-shoulders photos. Blank uses a featured success story image.",
      }),
      image("v2_home_hero_avatar_2", "Student photo 2", ""),
      image("v2_home_hero_avatar_3", "Student photo 3", ""),
      text(
        "v2_home_hero_proof",
        "Text beside avatars",
        "{scorers}+ successful scorers",
        { help: TOKEN_HELP }
      ),
      text("v2_home_hero_card_label", "Red card label", "Success rate"),
      area(
        "v2_home_hero_card_text",
        "Red card text",
        "Join {scorers}+ students who reached their target band with us",
        { help: TOKEN_HELP }
      ),
      image("v2_home_hero_image", "Banner image", "", {
        legacyKey: "hero_image",
        help: "Leave blank to use the founder photo.",
      }),
    ],
  },
  {
    id: "home-ticker",
    page: "Home",
    title: "Recent achievements",
    description:
      "Two rows of student scores scrolling in opposite directions, under the hero banner.",
    preview: "/",
    fields: [
      show("v2_home_ticker_show"),
      text("v2_home_ticker_label", "Label", "Recent Achievements"),
      text(
        "v2_home_ticker_title",
        "Heading",
        "Our students' success is our inspiration"
      ),
      area(
        "v2_home_ticker_description",
        "Description",
        "{scorers}+ students have reached their target band with FluentLearner. Here are some of the latest results.",
        { help: TOKEN_HELP }
      ),
      {
        key: "v2_home_ticker_items",
        label: "Achievements",
        type: "list",
        itemLabel: "Achievement",
        itemFields: [
          { name: "name", label: "Student name" },
          { name: "band", label: "Band score" },
          { name: "module", label: "Module (e.g. Overall, Reading)" },
          { name: "highlight", label: "Highlight (type yes)" },
        ],
        default: [
          ["Dr Milon Chowdhury", "8.0", "Overall", "yes"],
          ["Sajal Chaklader", "8.0", "Overall", "yes"],
          ["Dr Afroza", "9.0", "Listening", "yes"],
          ["Jian", "8.5", "Reading", ""],
          ["Lailun Tonny", "8.5", "Reading", ""],
          ["Ataur Rahman", "8.5", "Listening", ""],
          ["Jannatul Ferdous Binti", "8.5", "Reading", ""],
          ["Orko Rahman", "7.0", "Overall", ""],
          ["Suprova Das Keya", "7.0", "Overall", ""],
          ["Golam Imran", "7.0", "Overall", ""],
          ["Sharmin Mishu", "7.0", "Overall", ""],
          ["Nusrat Kabir", "7.0+", "Overall", ""],
          ["Raihan Rahmatullah", "7.5", "Speaking", ""],
          ["MD Safi", "8.5", "Listening", ""],
          ["Mohana Kabir", "8.0", "Listening", ""],
          ["Shakibur Rahman Joy", "8.0", "Reading", ""],
        ].map(([name, band, module, highlight]) => ({
          name,
          band,
          module,
          highlight,
        })),
      },
    ],
  },
  {
    id: "home-numbers",
    page: "Home",
    title: "Numbers",
    description:
      "Counters under the hero. Values come from Site-wide → Statistics. Also shown on the About page.",
    preview: "/",
    fields: [
      show("v2_home_numbers_show"),
      area(
        "v2_numbers_title",
        "Heading",
        "We focus[img]not only on IELTS scores but on building real-world[img]English confidence for life",
        { help: PILL_HELP }
      ),
      text("v2_numbers_label_scorers", "Students label", "Successful Scorers"),
      text("v2_numbers_label_rate", "Success rate label", "Success Rate"),
      text("v2_numbers_label_band", "Band score label", "Average Band Score"),
      text("v2_numbers_label_years", "Years label", "Years of Mentoring"),
    ],
  },
  {
    id: "home-courses",
    page: "Home",
    title: "Courses",
    description:
      "First four active courses. Manage the courses themselves under Learning → Courses.",
    preview: "/",
    fields: [
      show("v2_home_courses_show"),
      text(
        "v2_home_courses_title",
        "Heading",
        "Everything you need to reach your target band"
      ),
      text("v2_home_courses_button", "Button", "View All Courses"),
    ],
  },
  {
    id: "home-benefits",
    page: "Home",
    title: "Benefits",
    description: "Content is edited under Site-wide → Benefits block.",
    preview: "/",
    fields: [show("v2_home_benefits_show")],
  },
  {
    id: "home-about",
    page: "Home",
    title: "About",
    description: "Red block with reasons to choose FluentLearner.",
    preview: "/",
    fields: [
      show("v2_home_about_show"),
      text("v2_home_about_title_before", "Heading before number", "Trusted by"),
      text(
        "v2_home_about_title_after",
        "Heading after number",
        "students — here's why IELTS candidates choose us"
      ),
      area(
        "v2_home_about_description",
        "Description",
        "Founded by {founder}, FluentLearner is more than a coaching centre — it's a supportive community that helps you feel confident and prepared on exam day.",
        { legacyKey: "about_description", help: TOKEN_HELP }
      ),
      {
        key: "v2_home_about_reasons",
        label: "Reasons",
        type: "list",
        itemLabel: "Reason",
        itemFields: [{ name: "text", label: "Reason" }],
        default: [
          "One-to-One Mentoring",
          "Flexible Schedule",
          "Recorded Classes",
          "High Band Scores",
          "Detailed Writing Reviews",
          "24/7 WhatsApp Support",
        ].map(reason => ({ text: reason })),
      },
      text("v2_home_about_button", "Button", "Talk to a Mentor"),
      area(
        "v2_home_about_message",
        "Button message",
        "Assalamu Alaikum, I want to talk to a mentor about my IELTS preparation.",
        { help: WHATSAPP_HELP }
      ),
      image("v2_home_about_image", "Image", "", {
        legacyKey: "about_image",
        help: "Leave blank to use the founder photo.",
      }),
    ],
  },
  {
    id: "home-stories",
    page: "Home",
    title: "Success stories",
    description:
      "Grid of six result photos from featured stories, topped up with bundled results. Manage stories under Website → Success Stories.",
    preview: "/",
    fields: [
      show("v2_home_stories_show"),
      text(
        "v2_home_stories_title",
        "Heading",
        "Real students, verified band scores"
      ),
      area(
        "v2_home_stories_description",
        "Description",
        "Every result below is a real FluentLearner student who trusted us with their preparation"
      ),
      text("v2_home_stories_button", "Button", "All Success Stories"),
    ],
  },
  {
    id: "home-steps",
    page: "Home",
    title: "Steps",
    description: "Three-step path to the exam.",
    preview: "/",
    fields: [
      show("v2_home_steps_show"),
      area(
        "v2_home_steps_title",
        "Heading",
        "Reach your target band with structured lessons[img]and a clear path to exam day",
        { help: PILL_HELP }
      ),
      {
        key: "v2_home_steps_items",
        label: "Steps",
        type: "list",
        itemLabel: "Step",
        itemFields: [
          { name: "title", label: "Title" },
          { name: "text", label: "Text", type: "textarea" },
        ],
        default: [
          {
            title: "Enroll in a course",
            text: "Pick the plan that fits your goal and register online in a few minutes",
          },
          {
            title: "Practice with your mentor",
            text: "Build every module with guided lessons, mock tests and personal writing reviews",
          },
          {
            title: "Achieve your target band",
            text: "Walk into the exam prepared and confident, with our full support until results day",
          },
        ],
      },
    ],
  },
  {
    id: "home-closing",
    page: "Home",
    title: "Testimonials & call to action",
    description: "Content is edited under Site-wide.",
    preview: "/",
    fields: [
      show("v2_home_testimonials_show", "Show testimonials"),
      show("v2_home_cta_show", "Show closing call to action"),
    ],
  },
  seoSection(
    "home",
    "Home",
    "/",
    "FluentLearner - IELTS Coaching Platform (1-to-1 Mentorship)",
    "Expert-led IELTS preparation with one-to-one mentorship. Join 10,000+ successful scorers across Bangladesh. Verified results & real proof."
  ),

  // ─────────────────────────── About ───────────────────────────
  {
    id: "about-header",
    page: "About",
    title: "Page header",
    description: "Title block and banner at the top of the about page.",
    preview: "/about",
    fields: [
      text(
        "v2_about_header_title",
        "Title",
        "Where ambition meets real results"
      ),
      area(
        "v2_about_header_description",
        "Description",
        "FluentLearner is a mentoring-first IELTS and spoken English school — built on personal attention, honest feedback and verified results."
      ),
      image("v2_about_header_image", "Banner image", "", {
        legacyKey: "about_image",
        help: "Leave blank to use the founder photo.",
      }),
    ],
  },
  {
    id: "about-story",
    page: "About",
    title: "Our story",
    description: "Story block under the banner.",
    preview: "/about",
    fields: [
      text("v2_about_story_label", "Label", "Our story"),
      text("v2_about_story_title", "Heading", "More than a coaching centre"),
      area(
        "v2_about_story_text",
        "First paragraph",
        "Founded by {founder}, FluentLearner has grown into one of Bangladesh's most trusted IELTS coaching platforms. Our mission is simple — to turn every student's dream of studying or working abroad into reality through world-class preparation and unwavering support.",
        { legacyKey: "about_description", help: TOKEN_HELP }
      ),
      area(
        "v2_about_story_text_2",
        "Second paragraph",
        "With {scorers}+ successful scorers and a {successRate}% success rate, we believe personal attention beats crowded classrooms. Every student gets one-to-one mentoring that targets their own strengths and weaknesses, backed by mock tests, detailed writing reviews and support right up to exam day.",
        { help: `${TOKEN_HELP}. Leave blank to hide.` }
      ),
      show("v2_about_numbers_show", "Show numbers block"),
    ],
  },
  {
    id: "about-mission",
    page: "About",
    title: "Mission & vision",
    description: "Two cards under the numbers.",
    preview: "/about",
    fields: [
      text("v2_about_mission_title", "Mission heading", "Our mission"),
      area(
        "v2_about_mission",
        "Mission",
        "To make expert IELTS and English coaching accessible to every student in Bangladesh, with personal mentoring that turns effort into measurable band scores.",
        { legacyKey: "about_mission" }
      ),
      text("v2_about_vision_title", "Vision heading", "Our vision"),
      area(
        "v2_about_vision",
        "Vision",
        "A generation of confident English speakers who can study, work and build their future anywhere in the world.",
        { legacyKey: "about_vision" }
      ),
    ],
  },
  {
    id: "about-founder",
    page: "About",
    title: "Founder",
    description: "Name, photo and biography come from Site-wide → Founder.",
    preview: "/about",
    fields: [
      text("v2_about_founder_label", "Label", "Meet the founder"),
      text("v2_about_founder_primary", "First button", "Explore Courses"),
      text("v2_about_founder_secondary", "Second button", "Contact Us"),
      show("v2_about_benefits_show", "Show benefits block"),
      show("v2_about_cta_show", "Show closing call to action"),
    ],
  },
  seoSection(
    "about",
    "About",
    "/about",
    "About FluentLearner - Founder & 1-to-1 Mentorship Model",
    "Learn about our unique 1-to-1 mentorship approach that has helped 10,000+ students achieve their target IELTS band scores."
  ),

  // ─────────────────────────── Courses ───────────────────────────
  {
    id: "courses-header",
    page: "Courses",
    title: "Page header",
    description: "The course list itself is managed under Learning → Courses.",
    preview: "/courses",
    fields: [
      text(
        "v2_courses_header_title",
        "Title",
        "Courses built around your target band"
      ),
      area(
        "v2_courses_header_description",
        "Description",
        "From intensive one-to-one IELTS mentoring to spoken English foundations — every plan comes with mock tests, recorded classes and WhatsApp support."
      ),
      text("v2_courses_filter_all", "“All” filter label", "All courses"),
    ],
  },
  {
    id: "courses-advice",
    page: "Courses",
    title: "Advice box",
    description: "Dark box under the course list.",
    preview: "/courses",
    fields: [
      text(
        "v2_courses_advice_title",
        "Heading",
        "Not sure which course is right for you?"
      ),
      area(
        "v2_courses_advice_text",
        "Text",
        "Tell us your current level and target band — a mentor will recommend the plan that fits."
      ),
      text("v2_courses_advice_button", "Button", "Get Free Advice"),
      area(
        "v2_courses_advice_message",
        "Button message",
        "Assalamu Alaikum, can you help me choose the right course?",
        { help: WHATSAPP_HELP }
      ),
      show("v2_courses_benefits_show", "Show benefits block"),
      show("v2_courses_cta_show", "Show closing call to action"),
    ],
  },
  seoSection(
    "courses",
    "Courses",
    "/courses",
    "Our Courses - FluentLearner | IELTS VIP, Speaking & Grammar",
    "Choose from IELTS VIP Course (1-to-1), Basic Grammar & Spoken English, and IELTS Speaking Premium."
  ),

  // ─────────────────────────── Course detail ───────────────────────────
  {
    id: "course-detail",
    page: "Course detail",
    title: "Labels",
    description:
      "Headings and buttons on every course page. Course content is edited per course under Learning → Courses.",
    preview: "/courses",
    fields: [
      text("v2_course_about_title", "About heading", "About this course"),
      text("v2_course_outcomes_title", "Outcomes heading", "What you'll learn"),
      text("v2_course_curriculum_title", "Curriculum heading", "Curriculum"),
      text(
        "v2_course_audience_title",
        "Audience heading",
        "Who this course is for"
      ),
      text("v2_course_mentor_label", "Mentor label", "Your mentor"),
      text("v2_course_faq_title", "FAQ heading", "Frequently asked questions"),
      text("v2_course_fee_label", "Fee label", "Course fee"),
      text("v2_course_no_price", "Text when no price", "Contact us"),
      text("v2_course_enroll_text", "Enroll button", "Enroll Now"),
      text("v2_course_whatsapp_text", "WhatsApp button", "Ask on WhatsApp"),
      show("v2_course_cta_show", "Show closing call to action"),
    ],
  },
  {
    id: "course-missing",
    page: "Course detail",
    title: "Course not found",
    description:
      "Shown when a course link is broken or the course was removed.",
    preview: "/courses/not-a-course",
    fields: [
      text("v2_course_missing_title", "Title", "This course isn't available"),
      area(
        "v2_course_missing_text",
        "Text",
        "It may have been renamed or is no longer offered. Browse our current courses instead."
      ),
      text("v2_course_missing_button", "Button", "View All Courses"),
    ],
  },

  // ─────────────────────────── Success Stories ───────────────────────────
  {
    id: "stories-header",
    page: "Success Stories",
    title: "Page header",
    description:
      "The stories themselves are managed under Website → Success Stories.",
    preview: "/success-stories",
    fields: [
      text(
        "v2_stories_header_title",
        "Title",
        "Real students, verified results"
      ),
      area(
        "v2_stories_header_description",
        "Description",
        "Every card below is a FluentLearner student who reached their goal — band scores, visas and university offers."
      ),
      text(
        "v2_stories_stat_scorers",
        "Students stat label",
        "Successful scorers"
      ),
      text("v2_stories_stat_rate", "Success rate stat label", "Success rate"),
      text("v2_stories_stat_band", "Band stat label", "Average band"),
      text("v2_stories_filter_all", "“All” filter label", "All stories"),
      text(
        "v2_stories_empty",
        "Empty category text",
        "No stories in this category yet."
      ),
      show("v2_stories_testimonials_show", "Show testimonials"),
      show("v2_stories_cta_show", "Show closing call to action"),
    ],
  },
  seoSection(
    "stories",
    "Success Stories",
    "/success-stories",
    "Success Stories - Verified IELTS Results | FluentLearner",
    "Real student results with verified IELTS band scores. From Band 7.0 to 8.5 — see how FluentLearner students achieved their dreams."
  ),

  // ─────────────────────────── How It Works ───────────────────────────
  {
    id: "process-header",
    page: "How It Works",
    title: "Page header",
    description: "Title block at the top of the page.",
    preview: "/how-it-works",
    fields: [
      text(
        "v2_process_header_title",
        "Title",
        "A clear path from first class to exam day"
      ),
      area(
        "v2_process_header_description",
        "Description",
        "Five simple stages, one mentor beside you the whole way. Here's exactly what happens after you reach out."
      ),
      text("v2_process_header_button", "Button", "Book a Free Consultation"),
      area(
        "v2_process_header_message",
        "Button message",
        "Assalamu Alaikum, I would like a free IELTS consultation.",
        { help: WHATSAPP_HELP }
      ),
    ],
  },
  {
    id: "process-phases",
    page: "How It Works",
    title: "Stages",
    description: "Numbered stages from first contact to exam day.",
    preview: "/how-it-works",
    fields: [
      text("v2_process_label", "Label", "The process"),
      text("v2_process_title", "Heading", "What to expect, stage by stage"),
      area(
        "v2_process_text",
        "Text",
        "Every stage is guided by your mentor, and your plan is adjusted as your mock test scores improve."
      ),
      {
        key: "v2_process_phases",
        label: "Stages",
        type: "list",
        itemLabel: "Stage",
        itemFields: [
          { name: "title", label: "Title" },
          { name: "text", label: "Text", type: "textarea" },
          { name: "includes", label: "Tags (one per line)", type: "lines" },
        ],
        default: [
          {
            title: "Free consultation",
            text: "Message a mentor on WhatsApp with your current level, target band and exam date. We'll recommend the plan that fits your timeline.",
            includes:
              "Level check\nTarget band planning\nCourse recommendation",
          },
          {
            title: "Enroll and get your plan",
            text: "Register online in a few minutes and pay by bKash, Nagad, Rocket or bank transfer. Your study plan is built around your weakest modules.",
            includes:
              "Online enrollment\nFlexible payment\nPersonal study plan",
          },
          {
            title: "Learn with one-to-one mentoring",
            text: "Work through Listening, Reading, Writing and Speaking with a mentor who knows your strengths and gaps. Miss a class? Every session is recorded.",
            includes: "Live classes\nClass recordings\nStudy materials",
          },
          {
            title: "Practise with mock tests and feedback",
            text: "Sit exam-style mock tests and get detailed, band-descriptor based feedback. Every writing task is reviewed individually.",
            includes: "Mock tests\nWriting reviews\nSpeaking practice",
          },
          {
            title: "Walk into the exam ready",
            text: "Go into test day knowing exactly what to expect, with WhatsApp support all the way to your results and a certificate when you complete the course.",
            includes:
              "WhatsApp support\nExam-day confidence\nCertificate of completion",
          },
        ],
      },
      show("v2_process_benefits_show", "Show benefits block"),
    ],
  },
  {
    id: "process-faq",
    page: "How It Works",
    title: "FAQ",
    description: "General questions and answers.",
    preview: "/how-it-works",
    fields: [
      text("v2_faq_label", "Label", "FAQ"),
      text("v2_faq_title", "Heading", "Questions students ask us most"),
      area(
        "v2_faq_text",
        "Text",
        "Can't find your answer? Our team replies on WhatsApp within minutes."
      ),
      text("v2_faq_button", "WhatsApp button", "Ask a Question"),
      area(
        "v2_faq_message",
        "WhatsApp message",
        "Assalamu Alaikum, I have a question about FluentLearner courses.",
        { help: WHATSAPP_HELP }
      ),
      text("v2_faq_contact_button", "Contact button", "Contact Page"),
      {
        key: "v2_faq_items",
        label: "Questions",
        type: "list",
        itemLabel: "Question",
        itemFields: [
          { name: "question", label: "Question" },
          { name: "answer", label: "Answer", type: "textarea" },
        ],
        default: [
          {
            question: "Can I really get good results from an online course?",
            answer:
              "Absolutely. Most of our {scorers}+ successful students joined online batches. One-to-one mentoring gives you focused attention, structured feedback and direct support from your mentor.",
          },
          {
            question: "How long is the course? Can I prepare in one month?",
            answer:
              "Our IELTS VIP Course offers Plan A for one month and Plan B for two months. If your English foundation is already solid, an intensive one-month plan can help you make significant progress.",
          },
          {
            question: "I score low in Writing. How can you help?",
            answer:
              "Every writing task is reviewed individually. You receive detailed feedback, proven structures, vocabulary guidance and practical exercises based on the IELTS band descriptors.",
          },
          {
            question: "Will I get recordings if I miss a class?",
            answer:
              "Yes. Class recordings, study materials, mock tests and WhatsApp support are included, so you can review lessons at a convenient time.",
          },
          {
            question: "Why should I choose FluentLearner over other platforms?",
            answer:
              "You get one-to-one mentoring, a proven track record of {scorers}+ successful students and a {successRate}% success rate, plus practical course plans at accessible prices.",
          },
          {
            question: "Do you provide a certificate after course completion?",
            answer:
              "Yes. Students who complete a course receive a FluentLearner Certificate of Completion. Our main goal, however, is helping you reach your target IELTS band score.",
          },
          {
            question: "How do I pay? Can I pay in installments?",
            answer:
              "You can pay by bKash, Nagad, Rocket or bank transfer. Installment options may be available — contact us on WhatsApp to discuss a suitable payment plan.",
          },
        ],
      },
      show("v2_process_cta_show", "Show closing call to action"),
    ],
  },
  seoSection(
    "process",
    "How It Works",
    "/how-it-works",
    "How It Works | FluentLearner",
    "From a free consultation to exam day — see how FluentLearner's one-to-one IELTS mentoring works, step by step."
  ),

  // ─────────────────────────── Contact ───────────────────────────
  {
    id: "contact-header",
    page: "Contact",
    title: "Page header",
    description:
      "Contact details themselves are under Site-wide → Contact details.",
    preview: "/contact",
    fields: [
      text("v2_contact_header_title", "Title", "Let's plan your IELTS success"),
      area(
        "v2_contact_header_description",
        "Description",
        "Questions about courses, batches or payment? Reach us on any channel below — or send a message and a mentor will get back to you."
      ),
    ],
  },
  {
    id: "contact-channels",
    page: "Contact",
    title: "Channel cards",
    description: "Label and note on each contact card.",
    preview: "/contact",
    fields: [
      text("v2_contact_whatsapp_label", "WhatsApp label", "WhatsApp"),
      text(
        "v2_contact_whatsapp_note",
        "WhatsApp note",
        "Fastest way to reach us"
      ),
      text("v2_contact_phone_label", "Phone label", "Call us"),
      text("v2_contact_phone_note", "Phone note", "Talk to our team directly"),
      text("v2_contact_email_label", "Email label", "Email"),
      text("v2_contact_email_note", "Email note", "For detailed questions"),
      text("v2_contact_location_label", "Location label", "Location"),
      text("v2_contact_location_note", "Location note", "Where we're based"),
      text(
        "v2_contact_social_text",
        "Social strip text",
        "Follow our free IELTS tips"
      ),
    ],
  },
  {
    id: "contact-form",
    page: "Contact",
    title: "Message form",
    description:
      "The form opens WhatsApp with the visitor's message filled in.",
    preview: "/contact",
    fields: [
      text("v2_contact_form_label", "Label", "Send a message"),
      text("v2_contact_form_title", "Heading", "Tell us about your goal"),
      text("v2_contact_form_button", "Submit button", "Send via WhatsApp"),
      text(
        "v2_contact_form_note",
        "Note under button",
        "Opens WhatsApp with your message ready to send."
      ),
      text(
        "v2_contact_form_greeting",
        "First line of the message",
        "Assalamu Alaikum, I'm contacting FluentLearner from the website."
      ),
    ],
  },
  // ─────────────────────────── Enroll ───────────────────────────
  {
    id: "enroll-header",
    page: "Enroll",
    title: "Page header",
    description:
      "Title block and step names. Courses and payment methods are managed under Learning → Courses and Management → Payments.",
    preview: "/enroll",
    fields: [
      text("v2_enroll_header_title", "Title", "Enroll in your course"),
      area(
        "v2_enroll_header_description",
        "Description",
        "Three quick steps: choose your course, tell us who you are, and pay securely with bKash. Your seat is confirmed instantly."
      ),
      text("v2_enroll_step_course", "Step 1 name", "Choose course"),
      text("v2_enroll_step_details", "Step 2 name", "Your details"),
      text("v2_enroll_step_payment", "Step 3 name", "Pay"),
    ],
  },
  {
    id: "enroll-payment",
    page: "Enroll",
    title: "Payment step",
    description: "The final step, where students pay with bKash.",
    preview: "/enroll",
    fields: [
      area(
        "v2_enroll_details_note",
        "Details step note",
        "We'll use your mobile number to send your class details on WhatsApp."
      ),
      area(
        "v2_enroll_payment_note",
        "Payment note",
        "You'll be taken to bKash to pay securely with your bKash number, OTP and PIN. After paying you'll come straight back here and your seat is confirmed."
      ),
      text(
        "v2_enroll_payment_note_more",
        "Payment note (bKash, Nagad, Rocket, card)",
        "Pay securely with bKash, or with Nagad, Rocket or a card on the next page. After paying you'll come straight back here and your seat is confirmed."
      ),
      text("v2_enroll_pay_button", "Pay button", "Pay with bKash"),
      text(
        "v2_enroll_cancelled",
        "Cancelled message",
        "The payment was cancelled. You haven't been charged — you can try again below."
      ),
      text(
        "v2_enroll_failed",
        "Failed message",
        "The payment didn't go through and you haven't been charged. Please try again, or message us on WhatsApp."
      ),
    ],
  },
  {
    id: "enroll-help",
    page: "Enroll",
    title: "Help box",
    description: "Box under the order summary.",
    preview: "/enroll",
    fields: [
      text("v2_enroll_help_title", "Heading", "Need help enrolling?"),
      area(
        "v2_enroll_help_text",
        "Text",
        "Don't have bKash, or want to pay another way? Message a mentor on WhatsApp."
      ),
      area(
        "v2_enroll_help_message",
        "WhatsApp message",
        "Assalamu Alaikum, I need help with enrollment.",
        { help: WHATSAPP_HELP }
      ),
    ],
  },
  {
    id: "enroll-success",
    page: "Enroll",
    title: "Confirmation",
    description: "Shown after the enrollment is submitted.",
    preview: "/enroll",
    fields: [
      text("v2_enroll_success_title", "Title", "Application received"),
      area(
        "v2_enroll_success_text",
        "Text",
        "Your payment was successful and your seat is confirmed. A mentor will contact you on WhatsApp with your class details."
      ),
      text("v2_enroll_success_button", "WhatsApp button", "Chat on WhatsApp"),
      area(
        "v2_enroll_success_message",
        "WhatsApp message",
        "Assalamu Alaikum, I just enrolled and paid with bKash.",
        { help: WHATSAPP_HELP }
      ),
    ],
  },
  seoSection(
    "enroll",
    "Enroll",
    "/enroll",
    "Enroll | FluentLearner",
    "Enroll in a FluentLearner IELTS or spoken English course in three quick steps."
  ),

  seoSection(
    "contact",
    "Contact",
    "/contact",
    "Contact & Enroll - WhatsApp | FluentLearner",
    "Contact FluentLearner via WhatsApp or email. Enroll now for the next IELTS batch."
  ),
];

function seoSection(
  id: string,
  page: string,
  preview: string,
  title: string,
  description: string
): V2Section {
  return {
    id: `${id}-seo`,
    page,
    title: "Search & sharing",
    description:
      "Browser tab title and the description shown by Google and social previews.",
    preview,
    fields: [
      text(`v2_${id}_seo_title`, "Page title", title),
      area(`v2_${id}_seo_description`, "Description", description),
    ],
  };
}

export const V2_FIELDS: Record<string, V2Field> = Object.fromEntries(
  V2_SECTIONS.flatMap(section => section.fields).map(field => [
    field.key,
    field,
  ])
);
