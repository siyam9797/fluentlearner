import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  canCreateUserWithRole,
  canCreateUsers,
} from "@shared/roles";
import type { TrpcContext } from "./_core/context";
import { usersRouter } from "./mockRouters";

const newUser = {
  name: "Test User",
  email: "new-user@example.com",
  password: "test-password-123",
};

describe("user creation permissions", () => {
  it.each(["super_admin", "admin"])("%s can create every role", creatorRole => {
    expect(canCreateUsers(creatorRole)).toBe(true);
    for (const newRole of APP_ROLES) {
      expect(canCreateUserWithRole(creatorRole, newRole)).toBe(true);
    }
  });

  it("staff can create only students", () => {
    expect(canCreateUsers("staff")).toBe(true);
    for (const newRole of APP_ROLES) {
      expect(canCreateUserWithRole("staff", newRole)).toBe(
        newRole === "student"
      );
    }
  });

  it.each(["marketing", "mentor", "student"])(
    "%s cannot create users",
    creatorRole => {
      expect(canCreateUsers(creatorRole)).toBe(false);
      for (const newRole of APP_ROLES) {
        expect(canCreateUserWithRole(creatorRole, newRole)).toBe(false);
      }
    }
  );

  it("rejects a staff request for another role at the API", async () => {
    const caller = usersRouter.createCaller({
      user: { role: "staff" },
    } as TrpcContext);

    await expect(
      caller.create({ ...newUser, role: "admin" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
