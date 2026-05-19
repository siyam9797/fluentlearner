// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };
type LocalStorageConfig = { uploadDir: string; publicUploadUrl: string };

function getStorageConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function getLocalStorageConfig(): LocalStorageConfig | null {
  if (!ENV.uploadDir || !ENV.publicUploadUrl) {
    return null;
  }

  return {
    uploadDir: path.resolve(ENV.uploadDir),
    publicUploadUrl: ENV.publicUploadUrl.replace(/\/+$/, ""),
  };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toSafeLocalKey(relKey: string): string {
  const key = normalizeKey(relKey)
    .replace(/^uploads\//, "")
    .split(/[\\/]+/)
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  if (!key) {
    throw new Error("Invalid upload path");
  }

  return key;
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

async function storagePutLocal(
  config: LocalStorageConfig,
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<{ key: string; url: string }> {
  const key = toSafeLocalKey(relKey);
  const targetPath = path.resolve(config.uploadDir, key);

  if (!targetPath.startsWith(`${config.uploadDir}${path.sep}`)) {
    throw new Error("Invalid upload path");
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, data);

  return { key, url: `${config.publicUploadUrl}/${key}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const localConfig = getLocalStorageConfig();
  if (localConfig) {
    return storagePutLocal(localConfig, relKey, data);
  }

  const remoteConfig = getStorageConfig();
  if (!remoteConfig) {
    throw new Error(
      "Storage credentials missing: set UPLOAD_DIR and PUBLIC_UPLOAD_URL for VPS uploads, or BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY for remote storage"
    );
  }

  const { baseUrl, apiKey } = remoteConfig;
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const localConfig = getLocalStorageConfig();
  if (localConfig) {
    const key = toSafeLocalKey(relKey);
    return { key, url: `${localConfig.publicUploadUrl}/${key}` };
  }

  const remoteConfig = getStorageConfig();
  if (!remoteConfig) {
    throw new Error(
      "Storage credentials missing: set UPLOAD_DIR and PUBLIC_UPLOAD_URL for VPS uploads, or BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY for remote storage"
    );
  }

  const { baseUrl, apiKey } = remoteConfig;
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
