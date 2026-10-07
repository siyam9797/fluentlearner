import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { randomBytes } from "node:crypto";
import { appUserToAuthUser, createAppUser, getAppUserByEmail } from "../db";
import { hashPassword } from "./password";
import type { TrpcContext } from "./context";
import {
  canAccessAdminDashboard,
  canAccessStudentDashboard,
} from "@shared/roles";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !canAccessAdminDashboard(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  })
);

/** The Super Admin only: platform-level settings such as API keys. */
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the Super Admin can change this",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

/**
 * The local developer login has no account row, but the student area saves attempts and
 * profiles per account. Give it one (same email, Super Admin, random password) on first use.
 */
async function localAdminAccount(user: {
  email: string | null;
  name: string | null;
}) {
  if (!user.email) return null;
  const existing = await getAppUserByEmail(user.email);
  if (existing) return existing;
  await createAppUser({
    email: user.email,
    name: user.name || "Local Administrator",
    passwordHash: await hashPassword(randomBytes(24).toString("hex")),
    role: "super_admin",
  });
  return (await getAppUserByEmail(user.email)) ?? null;
}

/** Signed-in student accounts, and the Super Admin (who can use both dashboards). */
export const studentProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.openId === "local:admin") {
      const account = await localAdminAccount(ctx.user);
      if (account?.role === "super_admin" && account.isActive)
        return next({ ctx: { ...ctx, user: appUserToAuthUser(account) } });
    }
    if (
      !ctx.user.openId.startsWith("app:") ||
      !canAccessStudentDashboard(ctx.user.role)
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sign in with a student account to take mock tests",
      });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
