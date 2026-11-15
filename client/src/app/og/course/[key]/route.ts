/** GET /og/course/<slug or id>: the course's 1200 × 630 link-preview image (see server/courseShare.ts). */
import { courseShareImage, findActiveCourse } from "@server/courseShare";
import { siteUrl } from "../../../siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const course = await findActiveCourse(decodeURIComponent(key)).catch(
    () => null
  );
  const image = await courseShareImage(course, siteUrl());
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(image.length),
      // The URL carries ?v=<course updatedAt>, so a changed image gets a new URL.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
