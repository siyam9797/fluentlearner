import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Course } from "./database/schema";

const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "fl-share-"));
process.env.UPLOAD_DIR = uploadDir;
process.env.PUBLIC_UPLOAD_URL = "/uploads";

vi.mock("./db", () => ({ getActiveCourses: vi.fn(async () => []) }));

const { courseShareImage, courseShareImagePath, localImageFile, SHARE_IMAGE } =
  await import("./courseShare");

const SITE = "https://fluentlearner.com";

beforeAll(async () => {
  await fs.mkdir(path.join(uploadDir, "images"), { recursive: true });
  // A large, detailed featured image like the ones admins upload (2560 × 1244 random noise).
  const width = 2560;
  const height = 1244;
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 2654435761) >>> 24;
  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toFile(path.join(uploadDir, "images", "big.jpg"));
});

const course = (imageUrl: string | null, id = 1) =>
  ({
    id,
    slug: "ielts-vip-course",
    imageUrl,
    updatedAt: new Date("2026-11-16T10:00:00Z"),
  }) as Course;

describe("course share image", () => {
  it("turns a large featured image into a 1200 × 630 JPEG small enough for WhatsApp", async () => {
    const original = await fs.stat(path.join(uploadDir, "images", "big.jpg"));
    expect(original.size).toBeGreaterThan(300 * 1024);

    const image = await courseShareImage(
      course("/uploads/images/big.jpg"),
      SITE
    );
    const meta = await sharp(image).metadata();
    expect(meta.format).toBe("jpeg");
    expect([meta.width, meta.height]).toEqual([
      SHARE_IMAGE.width,
      SHARE_IMAGE.height,
    ]);
    expect(image.length).toBeLessThanOrEqual(280 * 1024);
  });

  it("accepts the image as a full URL on this site", async () => {
    expect(
      await localImageFile(`${SITE}/uploads/images/big.jpg`, SITE)
    ).toMatch(/images[\\/]big\.jpg$/);
  });

  it("never reads files outside the upload folder or other sites' URLs", async () => {
    expect(await localImageFile("/uploads/../../etc/passwd", SITE)).toBeNull();
    expect(
      await localImageFile("/uploads/%2e%2e/%2e%2e/etc/passwd", SITE)
    ).toBeNull();
    expect(
      await localImageFile("https://evil.example/uploads/images/big.jpg", SITE)
    ).toBeNull();
  });

  it("falls back to the default share image when the course has none", async () => {
    const image = await courseShareImage(course(null, 2), SITE);
    const meta = await sharp(image).metadata();
    expect([meta.width, meta.height]).toEqual([1200, 630]);
  });

  it("versions the URL by the course's last update, so a new image busts caches", () => {
    expect(courseShareImagePath(course("/x.jpg"))).toBe(
      `/og/course/ielts-vip-course?v=${Date.parse("2026-11-16T10:00:00Z")}`
    );
  });
});
