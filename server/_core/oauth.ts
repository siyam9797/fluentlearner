import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Decode the state parameter to extract returnPath.
 * Supports two formats:
 * 1. New JSON format: base64(JSON.stringify({ redirectUri, returnPath }))
 * 2. Legacy format: base64(redirectUri) — returnPath comes from query param
 */
function decodeReturnPath(state: string, fallbackReturnPath?: string): string {
  try {
    const decoded = atob(state);
    // Try JSON parse first (new format)
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.returnPath === "string") {
      return parsed.returnPath;
    }
  } catch {
    // Not JSON — legacy format, use fallback
  }
  return fallbackReturnPath || "/";
}

export function registerOAuthRoutes(app: Express) {
  // Security: remove X-Powered-By header to hide tech stack
  app.disable("x-powered-by");

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    // Legacy support: returnPath may still come as query param from older clients
    const returnPathFromQuery = getQueryParam(req, "returnPath");

    if (!code || !state) {
      // Don't reveal internal details in error messages
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "Authentication failed" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Extract returnPath from state (new format) or query param (legacy)
      const returnPath = decodeReturnPath(state, returnPathFromQuery);
      // Validate to prevent open redirect attacks - must start with /
      const safePath = returnPath && returnPath.startsWith("/") ? returnPath : "/";
      res.redirect(302, safePath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Generic error message — don't expose internal details
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}
