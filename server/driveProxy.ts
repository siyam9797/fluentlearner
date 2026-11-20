/**
 * Streams a Google Drive resource to a student through the portal, so the student never sees
 * the Drive link. The server downloads from Drive's public link (the file is shared "Anyone with
 * the link", which only the admins know); Google Docs, Sheets and Slides are exported first.
 */
import { parseDriveLink, type DriveLink } from "@shared/googleDrive";

export class DriveUnavailableError extends Error {}

/** Where the server downloads the file from; Docs, Sheets and Slides are exported. */
export function driveFetchUrl(link: DriveLink) {
  switch (link.kind) {
    case "file":
      return `https://drive.usercontent.google.com/download?id=${link.id}&export=download&confirm=t`;
    case "document":
      return `https://docs.google.com/document/d/${link.id}/export?format=pdf`;
    case "presentation":
      return `https://docs.google.com/presentation/d/${link.id}/export/pdf`;
    case "spreadsheets":
      return `https://docs.google.com/spreadsheets/d/${link.id}/export?format=xlsx`;
    default:
      return null;
  }
}

/** Types a browser can show safely in a tab; everything else is downloaded. */
const INLINE = [
  /^application\/pdf$/,
  /^image\/(png|jpe?g|gif|webp|avif)$/,
  /^audio\//,
  /^video\//,
  /^text\/plain$/,
];

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

/** The file name Drive sends (Content-Disposition), or one made from the resource title. */
export function fileNameFrom(disposition: string | null, title: string, type: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fall through to the plain name.
    }
  }
  const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  if (plain) return plain;
  const extension = EXTENSIONS[type];
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "resource";
  return extension ? `${base}.${extension}` : base;
}

/** Content-Disposition with an ASCII fallback and the full UTF-8 name. */
function disposition(kind: "inline" | "attachment", name: string) {
  const ascii = name.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Fetches a Drive resource and returns the response to send the student. Passes on Range
 * requests so audio and video can seek. Throws DriveUnavailableError when Drive won't hand the
 * file over (not shared by link, deleted, or a folder).
 */
export async function streamDriveFile(
  fileUrl: string,
  title: string,
  request: Request,
  fetcher: typeof fetch = fetch
) {
  const link = parseDriveLink(fileUrl);
  const source = link && driveFetchUrl(link);
  if (!source) throw new DriveUnavailableError("Not a Drive file");

  const range = request.headers.get("range");
  const upstream = await fetcher(source, {
    headers: range ? { Range: range } : undefined,
    redirect: "follow",
    signal: request.signal,
  });
  const type = (upstream.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  // A sign-in or "you need access" page comes back as HTML instead of the file.
  if (!upstream.ok || !upstream.body || type === "text/html") {
    await upstream.body?.cancel().catch(() => undefined);
    throw new DriveUnavailableError(
      `Drive answered ${upstream.status} ${type || "without a type"}`
    );
  }

  const contentType = type || "application/octet-stream";
  const name = fileNameFrom(
    upstream.headers.get("content-disposition"),
    title,
    contentType
  );
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": disposition(
      INLINE.some(pattern => pattern.test(contentType)) ? "inline" : "attachment",
      name
    ),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  });
  for (const header of ["content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
