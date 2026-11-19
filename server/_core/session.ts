import { createHash } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import type { User } from "../database/schema";
import * as db from "../db";

type SessionPayload =
  /** `pv` fingerprints the password a session was opened with (absent on sessions from before it existed). */
  | { authType: "app"; userId: number; pv?: string }
  | { authType: "local"; email: string; name: string };

/** Changes whenever the password does, so changing or resetting it ends every other session. */
function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

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
    const account = await db.getAppUserById(userId);
    if (!account) throw new Error("Account not found");
    return new SignJWT({
      authType: "app",
      userId,
      pv: passwordFingerprint(account.passwordHash),
    })
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
        return {
          authType: "app",
          userId: payload.userId,
          pv: typeof payload.pv === "string" ? payload.pv : undefined,
        };
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
    const found = await db.getAppUserById(session.userId);
    const user = found;
    if (!user || !user.isActive) throw ForbiddenError("User not found");
    if (session.pv && session.pv !== passwordFingerprint(user.passwordHash))
      throw ForbiddenError("Password changed; sign in again");
    const signedInAt = new Date();
    await db.updateAppUserLastSignedIn(user.id, signedInAt);
    return db.appUserToAuthUser({ ...user, lastSignedIn: signedInAt });
  }
}

export const sessionService = new SessionService();
