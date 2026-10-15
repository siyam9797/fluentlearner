import { NextRequest, NextResponse } from "next/server";
import { sendMetaPageView } from "@server/metaConversions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const siteOrigin = process.env.PUBLIC_SITE_URL
    ? new URL(process.env.PUBLIC_SITE_URL).origin
    : request.nextUrl.origin;
  if (request.headers.get("origin") !== siteOrigin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") || 0) > 1024) {
    return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  }

  let body: { eventId?: unknown; path?: unknown } | null;
  try {
    const raw = await request.text();
    if (raw.length > 1024) {
      return NextResponse.json({ error: "Invalid request" }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.eventId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      body.eventId
    ) ||
    typeof body.path !== "string" ||
    !/^\/(?!\/)[^?#]*$/.test(body.path) ||
    body.path.length > 2048 ||
    /^\/(admin|student|api)(\/|$)/.test(body.path)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await sendMetaPageView({
    eventId: body.eventId,
    path: body.path,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    userAgent: request.headers.get("user-agent"),
    fbp: request.cookies.get("_fbp")?.value || null,
    fbc: request.cookies.get("_fbc")?.value || null,
  });

  return new NextResponse(null, { status: 204 });
}
