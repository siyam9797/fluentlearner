import { NextRequest, NextResponse } from "next/server";
import { sendMetaPageView } from "@server/metaConversions";

export const runtime = "nodejs";

/**
 * Only our own pages may report page views. Behind a proxy the app's own URL can
 * differ from the public one, so accept the browser's same-origin marker, the
 * configured site URL, or an Origin matching the host the request was sent to.
 */
function isSameSite(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "same-origin") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = [
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
    request.headers.get("host"),
    request.nextUrl.host,
  ];
  try {
    if (process.env.PUBLIC_SITE_URL)
      allowed.push(new URL(process.env.PUBLIC_SITE_URL).host);
  } catch {
    // Ignore a malformed PUBLIC_SITE_URL; the other checks still apply.
  }
  return allowed.includes(originHost);
}

export async function POST(request: NextRequest) {
  if (!isSameSite(request)) {
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
