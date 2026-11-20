/**
 * GET /api/resources/:id/file — a resource file for a signed-in student, streamed from Google
 * Drive so the Drive link never reaches the browser. Students get only resources shared with all
 * students or with their batch (the same check as their Resources page); admins get any.
 */
import { TRPCError } from "@trpc/server";
import { createContext } from "@server/_core/context";
import { getLearningResource } from "@server/mockDb";
import { DriveUnavailableError, streamDriveFile } from "@server/driveProxy";
import { appRouter } from "@server/routers";
import { canAccessAdminDashboard } from "@shared/roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const text = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return text("Not found", 404);

  const ctx = await createContext({
    req: request,
    resHeaders: new Headers(),
    info: {} as never,
  });
  if (!ctx.user) return text("Sign in to open this resource.", 401);

  if (!canAccessAdminDashboard(ctx.user.role)) {
    try {
      const shared = await appRouter.createCaller(ctx).student.resources();
      if (!shared.some(row => row.resource.id === id))
        return text("Not found", 404);
    } catch (error) {
      if (error instanceof TRPCError) return text("Forbidden", 403);
      throw error;
    }
  }

  const resource = await getLearningResource(id);
  if (!resource) return text("Not found", 404);
  try {
    return await streamDriveFile(resource.fileUrl, resource.title, request);
  } catch (error) {
    if (!(error instanceof DriveUnavailableError)) throw error;
    console.warn(`[Resources] Drive file for resource ${id}: ${error.message}`);
    return text(
      "This file isn't available right now. Please let your mentor know.",
      502
    );
  }
}
