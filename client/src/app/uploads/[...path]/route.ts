import fs from "node:fs/promises";
import path from "node:path";
import { ENV } from "@server/_core/env";
import { sessionService } from "@server/_core/session";
import { canAccessAdminDashboard } from "@shared/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  if (
    !segments?.length ||
    segments.some(segment => !segment || segment === "." || segment === ".." || segment.includes("\\") || segment.includes("/"))
  ) {
    return new Response("Not found", { status: 404 });
  }

  if (segments[0] === "payment-screenshots") {
    const user = await sessionService.authenticateRequest(request).catch(() => null);
    if (!user || !canAccessAdminDashboard(user.role)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const root = path.resolve(ENV.uploadDir);
  const filename = path.resolve(root, ...segments);
  if (!filename.startsWith(`${root}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const [realRoot, realFile] = await Promise.all([
      fs.realpath(root),
      fs.realpath(filename),
    ]);
    if (!realFile.startsWith(`${realRoot}${path.sep}`)) {
      return new Response("Not found", { status: 404 });
    }
    const stat = await fs.stat(realFile);
    if (!stat.isFile()) return new Response("Not found", { status: 404 });
    const extension = path.extname(realFile).slice(1).toLowerCase();
    const contentType = contentTypes[extension] ?? "application/octet-stream";
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    });
    if (contentType === "application/octet-stream" || extension === "csv" || extension === "txt") {
      headers.set("Content-Disposition", "attachment");
    }
    return new Response(await fs.readFile(realFile), { headers });
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) {
      return new Response("Not found", { status: 404 });
    }
    throw error;
  }
}
