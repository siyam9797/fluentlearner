import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import type { User } from "../database/schema";
import * as db from "../db";

type SessionPayload =
  | { authType: "app"; userId: number }
  | { authType: "local"; email: string; name: string };

class SessionService {
  private secret() {
    const value = process.env.JWT_SECRET;
    if (value) return new TextEncoder().encode(value);
    if (process.env.NODE_ENV !== "production") {
      return new TextEncoder().encode(
        "fluentlearner-local-development-secret-change-me"
      );
    }
    throw new Error("JWT_SECRET is required in production");
  }

  async createAppSessionToken(userId: number, expiresInMs = ONE_YEAR_MS) {
    return new SignJWT({ authType: "app", userId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
      .sign(this.secret());
  }

  async createLocalAdminSessionToken(
    email: string,
    name: string,
    expiresInMs = ONE_YEAR_MS
  ) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Local administrator login is disabled in production");
    }
    return new SignJWT({ authType: "local", email, name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
      .sign(this.secret());
  }

  async verifySession(
    value: string | undefined
  ): Promise<SessionPayload | null> {
    if (!value) return null;
    try {
      const { payload } = await jwtVerify(value, this.secret(), {
        algorithms: ["HS256"],
      });
      if (payload.authType === "app" && typeof payload.userId === "number") {
        return { authType: "app", userId: payload.userId };
      }
      if (
        payload.authType === "local" &&
        typeof payload.email === "string" &&
        typeof payload.name === "string"
      ) {
        return { authType: "local", email: payload.email, name: payload.name };
      }
      return null;
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.get("cookie") ?? "");
    const session = await this.verifySession(cookies[COOKIE_NAME]);
    if (!session) throw ForbiddenError("Invalid session cookie");
    if (session.authType === "local") {
      if (process.env.NODE_ENV === "production")
        throw ForbiddenError("Local login is disabled");
      const now = new Date();
      return {
        id: 0,
        openId: "local:admin",
        email: session.email,
        name: session.name,
        loginMethod: "local",
        role: "super_admin",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      };
    }
    const user = await db.getAppUserById(session.userId);
    if (!user || !user.isActive) throw ForbiddenError("User not found");
    const signedInAt = new Date();
    await db.updateAppUserLastSignedIn(user.id, signedInAt);
    return db.appUserToAuthUser({ ...user, lastSignedIn: signedInAt });
  }
}

export const sessionService = new SessionService();
