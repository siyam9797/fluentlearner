import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function safeKey(relKey: string) {
  const key = relKey
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .split(/[\\/]+/)
    .filter(part => part && part !== "." && part !== "..")
    .join("/");
  if (!key) throw new Error("Invalid upload path");
  return key;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = safeKey(relKey);
  const root = path.resolve(ENV.uploadDir);
  const target = path.resolve(root, key);
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error("Invalid upload path");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  return { key, url: `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key}` };
}

/** "My Photo (1).JPG" → { base: "My-Photo-1", ext: "jpg" }; keeps names readable and URL-safe. */
function cleanFileName(filename: string, fallbackExt: string) {
  const dot = filename.lastIndexOf(".");
  const rawBase = dot > 0 ? filename.slice(0, dot) : filename;
  const rawExt = dot > 0 ? filename.slice(dot + 1) : "";
  const base =
    rawBase
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 80) || "file";
  const ext =
    rawExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 5) || fallbackExt;
  return { base, ext };
}

/**
 * Stores an upload under its original (cleaned) file name in `folder`. If that name is
 * taken, adds -1, -2, … — never overwriting an existing file.
 */
export async function storagePutNamed(
  folder: string,
  filename: string,
  data: Buffer | Uint8Array | string,
  fallbackExt = "bin"
): Promise<{ key: string; url: string }> {
  const { base, ext } = cleanFileName(filename, fallbackExt);
  const root = path.resolve(ENV.uploadDir);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const name = attempt === 0 ? `${base}.${ext}` : `${base}-${attempt}.${ext}`;
    const key = safeKey(`${folder}/${name}`);
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`))
      throw new Error("Invalid upload path");
    await fs.mkdir(path.dirname(target), { recursive: true });
    try {
      // "wx" fails if the file exists, so two uploads can never overwrite each other.
      await fs.writeFile(target, data, { flag: "wx" });
      return { key, url: `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key}` };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  throw new Error("Could not find a free file name");
}

export async function storageGet(relKey: string) {
  const key = safeKey(relKey);
  return { key, url: `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key}` };
}
