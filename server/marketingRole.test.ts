import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  canAccessAdminDashboard,
  canAccessAdminPortal,
  canManageMarketing,
  canManageUsers,
} from "@shared/roles";
import { USER_ROLES } from "./database/schema";
import { adminProcedure, marketingProcedure, router } from "./_core/trpc";
import type { TrpcContext } from "./_core/context";

const accessRouter = router({
  marketing: marketingProcedure.query(() => "allowed"),
  admin: adminProcedure.query(() => "allowed"),
});

const callerFor = (role: string) =>
  accessRouter.createCaller({ user: { role } } as TrpcContext);

describe("Marketing role", () => {
  it("is assignable and supported by both user tables", () => {
    expect(APP_ROLES).toContain("marketing");
    expect(USER_ROLES).toContain("marketing");
  });

  it("can enter the portal and edit Marketing settings without admin privileges", async () => {
    expect(canAccessAdminPortal("marketing")).toBe(true);
    expect(canAccessAdminDashboard("marketing")).toBe(false);
    expect(canManageMarketing("marketing")).toBe(true);
    expect(canManageUsers("marketing")).toBe(false);
    await expect(callerFor("marketing").marketing()).resolves.toBe("allowed");
    await expect(callerFor("marketing").admin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps Marketing settings unavailable to Staff and students", async () => {
    await expect(callerFor("staff").marketing()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(callerFor("student").marketing()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(callerFor("admin").marketing()).resolves.toBe("allowed");
  });
});
