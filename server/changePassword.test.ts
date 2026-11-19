import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const accounts = new Map<number, { id: number; passwordHash: string }>();

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAppUserById: vi.fn(async (id: number) => accounts.get(id)),
  updateAppUserPassword: vi.fn(async (id: number, passwordHash: string) => {
    const account = accounts.get(id);
    if (account) account.passwordHash = passwordHash;
  }),
}));

const { appRouter } = await import("./routers");
const { hashPassword, verifyPassword } = await import("./_core/password");

const setCookie = vi.fn();

function callerFor(user: { id: number; openId: string; role: string }) {
  return appRouter.createCaller({
    user: { ...user, email: "someone@example.com", name: "Someone" },
    req: new Request("http://localhost/api/trpc"),
    setCookie,
  } as unknown as TrpcContext);
}

describe("auth.changePassword", () => {
  beforeEach(async () => {
    accounts.clear();
    setCookie.mockClear();
    accounts.set(7, {
      id: 7,
      passwordHash: await hashPassword("old-password"),
    });
  });

  it.each(["super_admin", "admin", "staff", "mentor", "marketing", "student"])(
    "lets a %s change their own password",
    async role => {
      const caller = callerFor({ id: 7, openId: "app:7", role });
      await expect(
        caller.auth.changePassword({
          currentPassword: "old-password",
          newPassword: "new-password-1",
        })
      ).resolves.toEqual({ success: true });
      const stored = accounts.get(7)!.passwordHash;
      expect(await verifyPassword("new-password-1", stored)).toBe(true);
      expect(await verifyPassword("old-password", stored)).toBe(false);
      // A fresh session cookie keeps this browser signed in after the change.
      expect(setCookie).toHaveBeenCalledTimes(1);
    }
  );

  it("rejects a wrong current password and keeps the old one", async () => {
    const caller = callerFor({ id: 7, openId: "app:7", role: "admin" });
    await expect(
      caller.auth.changePassword({
        currentPassword: "wrong",
        newPassword: "new-password-1",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(
      await verifyPassword("old-password", accounts.get(7)!.passwordHash)
    ).toBe(true);
  });

  it("rejects short and unchanged passwords", async () => {
    const caller = callerFor({ id: 7, openId: "app:7", role: "admin" });
    await expect(
      caller.auth.changePassword({
        currentPassword: "old-password",
        newPassword: "short",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.auth.changePassword({
        currentPassword: "old-password",
        newPassword: "old-password",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a signed-in user", async () => {
    const caller = appRouter.createCaller({ user: null } as TrpcContext);
    await expect(
      caller.auth.changePassword({
        currentPassword: "old-password",
        newPassword: "new-password-1",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refuses the development login, whose password lives in .env", async () => {
    const caller = callerFor({
      id: 0,
      openId: "local:admin",
      role: "super_admin",
    });
    await expect(
      caller.auth.changePassword({
        currentPassword: "admin12345",
        newPassword: "new-password-1",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
