import type { Metadata } from "next";
import "@/index.css";

import { getSiteSettingByKey } from "@server/db";

// Re-read the Branding settings at most once a minute (the page is otherwise built once).
export const revalidate = 60;

/** Favicon and page title come from Admin → Settings → Branding, with these defaults. */
export async function generateMetadata(): Promise<Metadata> {
  const setting = async (key: string) =>
    (
      await getSiteSettingByKey(key).catch(() => undefined)
    )?.settingValue?.trim() || null;
  const [title, favicon] = await Promise.all([
    setting("page_title"),
    setting("favicon"),
  ]);
  return {
    title: title || "FluentLearner - IELTS Coaching Platform",
    description: "Expert-led IELTS preparation with one-to-one mentorship.",
    icons: { icon: favicon || "/favicon.jpg" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
