/**
 * Link previews for course pages (WhatsApp, Facebook, Messenger, LinkedIn, X…).
 *
 * Preview crawlers read the page's HTML once and fetch og:image themselves. Course featured images
 * are uploaded at full size (often 2000px+, several hundred KB), which WhatsApp in particular skips
 * (it drops images above roughly 300 KB). So every course gets a dedicated 1200 × 630 JPEG made from
 * its featured image, served at /og/course/<slug or id>.
 *
 * Only images stored on this site (uploads or public/) are read; other URLs fall back to the default
 * share image, so the server never fetches arbitrary addresses.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ENV } from "./_core/env";
import { getActiveCourses } from "./db";
import type { Course } from "./database/schema";

export const SHARE_IMAGE = { width: 1200, height: 630 } as const;
/** Stay under WhatsApp's preview size limit with room to spare. */
const MAX_BYTES = 280 * 1024;
const PUBLIC_DIR = path.resolve("client/public");
const DEFAULT_IMAGE = path.join(PUBLIC_DIR, "og-default.jpg");

/** An active course by slug, or by numeric ID, as the course page looks it up. */
export async function findActiveCourse(key: string) {
  const rows = await getActiveCourses();
  return (
    rows.find(course =>
      /^\d+$/.test(key) ? course.id === Number(key) : course.slug === key
    ) ?? null
  );
}

/** Path of the course's share image, versioned so a new featured image busts preview caches. */
export function courseShareImagePath(
  course: Pick<Course, "id" | "slug" | "updatedAt">
) {
  const version = new Date(course.updatedAt).getTime() || 0;
  return `/og/course/${encodeURIComponent(course.slug || String(course.id))}?v=${version}`;
}

/** Resolve `child` inside `root`, refusing anything that escapes it. */
async function fileInside(root: string, child: string) {
  const parts = child.split("/").filter(Boolean);
  if (parts.some(part => part === "." || part === ".." || part.includes("\\")))
    return null;
  const target = path.resolve(root, ...parts);
  try {
    const [realRoot, realTarget] = await Promise.all([
      fs.realpath(root),
      fs.realpath(target),
    ]);
    if (!realTarget.startsWith(`${realRoot}${path.sep}`)) return null;
    return (await fs.stat(realTarget)).isFile() ? realTarget : null;
  } catch {
    return null;
  }
}

/** The local file behind a stored image URL ("/uploads/…", "https://<this site>/uploads/…", "/logo.png"). */
export async function localImageFile(
  imageUrl: string | null | undefined,
  siteOrigin: string
) {
  if (!imageUrl?.trim()) return null;
  let url: URL;
  try {
    url = new URL(imageUrl.trim(), siteOrigin);
  } catch {
    return null;
  }
  if (url.origin !== new URL(siteOrigin).origin) return null;
  const pathname = decodeURIComponent(url.pathname);
  const uploadPrefix = `${ENV.publicUploadUrl.replace(/\/+$/, "")}/`;
  if (pathname.startsWith(uploadPrefix))
    return fileInside(
      path.resolve(ENV.uploadDir),
      pathname.slice(uploadPrefix.length)
    );
  return fileInside(PUBLIC_DIR, pathname);
}

async function render(source: Buffer) {
  const base = sharp(source, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(SHARE_IMAGE.width, SHARE_IMAGE.height, {
      fit: "cover",
      position: "attention",
    })
    .flatten({ background: "#ffffff" });
  let output = await base
    .clone()
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  for (const quality of [70, 58]) {
    if (output.length <= MAX_BYTES) break;
    output = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  return output;
}

// Re-encoding is cheap but not free; crawlers fetch the same image repeatedly.
const cache = new Map<string, Buffer>();

/** The 1200 × 630 share JPEG for a course, falling back to the site's default share image. */
export async function courseShareImage(
  course: Course | null,
  siteOrigin: string
) {
  const key = course
    ? `${course.id}:${new Date(course.updatedAt).getTime()}:${course.imageUrl ?? ""}`
    : "default";
  const hit = cache.get(key);
  if (hit) return hit;

  const file =
    (course && (await localImageFile(course.imageUrl, siteOrigin))) ||
    DEFAULT_IMAGE;
  let image: Buffer;
  try {
    image = await render(await fs.readFile(file));
  } catch {
    image = await render(await fs.readFile(DEFAULT_IMAGE));
  }
  if (cache.size > 200) cache.clear();
  cache.set(key, image);
  return image;
}
