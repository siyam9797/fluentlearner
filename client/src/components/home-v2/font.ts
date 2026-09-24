import { Inter_Tight } from "next/font/google";

/** Inter Tight for every v2-styled surface; apply `interTight.variable` next to the `home-v2` class. */
export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});
