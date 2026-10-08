import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import {
  appUsers,
  courses,
  enrollments,
  learningResources,
  mockAnswers,
  mockSections,
  paymentSettings,
  siteSettings,
  successStories,
} from "./database/schema";

export type MediaKind = "image" | "video" | "audio" | "document";

export type MediaFile = {
  key: string;
  url: string;
  name: string;
  size: number;
  modifiedAt: string;
  kind: MediaKind;
  inUse: boolean;
};

const imageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "svg",
  "avif",
]);
const videoExtensions = new Set(["mp4", "webm", "mov", "m4v"]);
const audioExtensions = new Set(["mp3", "wav", "m4a", "aac", "ogg", "webm"]);

function kindFromName(name: string): MediaKind {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  if (audioExtensions.has(extension)) return "audio";
  return "document";
}

function publicUrl(key: string) {
  return `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key.split(path.sep).join("/")}`;
}

function safeMediaKey(value: string) {
  const prefix = ENV.publicUploadUrl.replace(/\/$/, "");
  const withoutPrefix = value.startsWith(`${prefix}/`)
    ? value.slice(prefix.length + 1)
    : value;
  const key = withoutPrefix
    .replace(/^\/+/, "")
    .split(/[\\/]+/)
    .filter(part => part && part !== "." && part !== "..")
    .join("/");
  if (!key || key !== withoutPrefix.replace(/^\/+/, "").replace(/\\/g, "/"))
    throw new Error("Invalid media path");
  return key;
}

async function collectFiles(
  directory: string,
  root: string
): Promise<Omit<MediaFile, "inUse">[]> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const results = await Promise.all(
    entries.map(async entry => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(target, root);
      if (!entry.isFile()) return [];
      const info = await fs.stat(target);
      const key = path.relative(root, target).split(path.sep).join("/");
      return [
        {
          key,
          url: publicUrl(key),
          name: entry.name,
          size: info.size,
          modifiedAt: info.mtime.toISOString(),
          kind: kindFromName(entry.name),
        },
      ];
    })
  );
  return results.flat();
}

/** The bundled logos and favicon (client/public), copied into the library under branding/. */
const BRANDING_FILES = ["logo.svg", "logo-white.svg", "favicon.jpg"];

/** Puts the default logos and favicon in the media library so they can be picked like any upload. */
async function ensureBrandingFiles() {
  const folder = path.join(path.resolve(ENV.uploadDir), "branding");
  await fs.mkdir(folder, { recursive: true });
  await Promise.all(
    BRANDING_FILES.map(async name => {
      const target = path.join(folder, name);
      if (await fs.stat(target).catch(() => null)) return;
      await fs
        .copyFile(path.resolve("client/public", name), target)
        .catch(error =>
          console.warn(`[Media] Could not add ${name} to the library:`, error)
        );
    })
  );
}

async function usedMediaUrls() {
  const db = await getDb();
  const used = new Set<string>();
  if (!db) return used;
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim()) used.add(value.trim());
  };
  const rows = await Promise.all([
    db
      .select({
        imageUrl: courses.imageUrl,
        instructorPhoto: courses.instructorPhoto,
        videoUrl: courses.videoUrl,
      })
      .from(courses),
    db
      .select({
        imageUrl: successStories.imageUrl,
        thumbnailUrl: successStories.thumbnailUrl,
      })
      .from(successStories),
    db
      .select({
        iconUrl: paymentSettings.iconUrl,
        qrCodeUrl: paymentSettings.qrCodeUrl,
      })
      .from(paymentSettings),
    db
      .select({ paymentScreenshotUrl: enrollments.paymentScreenshotUrl })
      .from(enrollments),
    db.select({ settingValue: siteSettings.settingValue }).from(siteSettings),
    db.select({ fileUrl: learningResources.fileUrl }).from(learningResources),
    db.select({ avatarUrl: appUsers.avatarUrl }).from(appUsers),
    db
      .select({
        imageUrl: mockSections.imageUrl,
        audioUrl: mockSections.audioUrl,
      })
      .from(mockSections),
    db.select({ audioUrl: mockAnswers.audioUrl }).from(mockAnswers),
  ]);
  rows.flat().forEach(row => Object.values(row).forEach(add));
  // The default branding files back the site's logos and favicon; keep them from being deleted.
  BRANDING_FILES.forEach(name =>
    used.add(publicUrl(path.join("branding", name)))
  );
  return used;
}

export async function listMediaFiles(): Promise<MediaFile[]> {
  const root = path.resolve(ENV.uploadDir);
  await ensureBrandingFiles();
  const [files, used] = await Promise.all([
    collectFiles(root, root),
    usedMediaUrls(),
  ]);
  return files
    .map(file => ({ ...file, inUse: used.has(file.url) }))
    .sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));
}

export async function deleteMediaFile(value: string) {
  const key = safeMediaKey(value);
  const url = publicUrl(key);
  const used = await usedMediaUrls();
  if (used.has(url))
    throw new Error("This file is in use and cannot be deleted.");
  const root = path.resolve(ENV.uploadDir);
  const target = path.resolve(root, key);
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error("Invalid media path");
  try {
    await fs.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
