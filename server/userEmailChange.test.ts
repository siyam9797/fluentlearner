import { beforeEach, describe, expect, it, vi } from "vitest";
import { canChangeEmailOf, type AppRole } from "@shared/roles";
import type { TrpcContext } from "./_core/context";

type Account = { id: number; email: string; role: AppRole };
const accounts = new Map<number, Account>();

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAppUserById: vi.fn(async (id: number) => accounts.get(id)),
}));

const changeUserEmail = vi.fn(async (id: number, email: string) => {
  accounts.get(id)!.email = email;
});
vi.mock("./mockDb", async importOriginal => ({
  ...(await importOriginal<typeof import("./mockDb")>()),
  changeUserEmail: (id: number, email: string) => changeUserEmail(id, email),
  updateUser: vi.fn(async () => undefined),
}));

const { appRouter } = await import("./routers");

const ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "marketing",
  "staff",
  "mentor",
  "student",
];

function callerAs(id: number, role: AppRole) {
  return appRouter.createCaller({
    user: {
      id,
      openId: `app:${id}`,
      role,
      email: `${role}@x.test`,
      name: role,
    },
  } as unknown as TrpcContext);
}

describe("canChangeEmailOf", () => {
  it("lets the Super Admin change every role's email", () => {
    for (const role of ROLES)
      expect(canChangeEmailOf("super_admin", role)).toBe(true);
  });

  it("lets an Admin change only lower roles", () => {
    expect(canChangeEmailOf("admin", "super_admin")).toBe(false);
    expect(canChangeEmailOf("admin", "admin")).toBe(false);
    for (const role of ["marketing", "staff", "mentor", "student"] as const)
      expect(canChangeEmailOf("admin", role)).toBe(true);
  });

  it("gives no other role the right", () => {
    for (const actor of ["marketing", "staff", "mentor", "student"] as const)
      for (const role of ROLES)
        expect(canChangeEmailOf(actor, role)).toBe(false);
  });
});

describe("users.update email", () => {
  beforeEach(() => {
    accounts.clear();
    changeUserEmail.mockClear();
    ROLES.forEach((role, index) =>
      accounts.set(index + 1, { id: index + 1, email: `${role}@x.test`, role })
    );
  });

  it("Super Admin can change an Admin's email (normalised)", async () => {
    await callerAs(1, "super_admin").users.update({
      id: 2,
      email: "  New.Admin@X.test ",
    });
    expect(changeUserEmail).toHaveBeenCalledWith(2, "new.admin@x.test");
  });

  it("Super Admin can change their own email", async () => {
    await callerAs(1, "super_admin").users.update({
      id: 1,
      email: "me@x.test",
    });
    expect(changeUserEmail).toHaveBeenCalledWith(1, "me@x.test");
  });

  it("Admin can change a student's email", async () => {
    await callerAs(2, "admin").users.update({ id: 6, email: "s2@x.test" });
    expect(changeUserEmail).toHaveBeenCalledWith(6, "s2@x.test");
  });

  it("Admin cannot change a Super Admin's or their own email", async () => {
    await expect(
      callerAs(2, "admin").users.update({ id: 1, email: "x@x.test" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      callerAs(2, "admin").users.update({ id: 2, email: "x@x.test" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(changeUserEmail).not.toHaveBeenCalled();
  });

  it("Staff cannot change emails", async () => {
    await expect(
      callerAs(4, "staff").users.update({ id: 6, email: "x@x.test" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("an unchanged email is not rewritten", async () => {
    await callerAs(2, "admin").users.update({ id: 6, email: "STUDENT@x.test" });
    expect(changeUserEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    await expect(
      callerAs(1, "super_admin").users.update({ id: 6, email: "not-an-email" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
