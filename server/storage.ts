import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from "./_core/env";

function safeKey(relKey: string) {
  const key = relKey.replace(/^\/+/, "").replace(/^uploads\//, "")
    .split(/[\\/]+/).filter(part => part && part !== "." && part !== "..").join("/");
  if (!key) throw new Error("Invalid upload path");
  return key;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = safeKey(relKey);
  const root = path.resolve(ENV.uploadDir);
  const target = path.resolve(root, key);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid upload path");
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  return { key, url: `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key}` };
}

export async function storageGet(relKey: string) {
  const key = safeKey(relKey);
  return { key, url: `${ENV.publicUploadUrl.replace(/\/$/, "")}/${key}` };
}
