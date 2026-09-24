import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "FluentLearner - IELTS Coaching Platform",
  description: "Expert-led IELTS preparation with one-to-one mentorship.",
  icons: { icon: "/favicon.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
