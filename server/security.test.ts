import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const accounts = new Map<
  number,
  { id: number; email: string; passwordHash: string; isActive: boolean }
>();

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAppUserById: vi.fn(async (id: number) => accounts.get(id)),
  getAppUserByEmail: vi.fn(async (email: string) =>
    [...accounts.values()].find(a => a.email === email)
  ),
  updateAppUserLastSignedIn: vi.fn(async () => {}),
  appUserToAuthUser: vi.fn((user: { id: number }) => ({
    ...user,
    openId: `app:${user.id}`,
    role: "student",
  })),
}));

const { appRouter } = await import("./routers");
const { hashPassword } = await import("./_core/password");
const { sessionService } = await import("./_core/session");
const { resetAllLimits } = await import("./_core/rateLimit");
const { COOKIE_NAME } = await import("@shared/const");

function callerAs(role: string | null, ip = "203.0.113.7") {
  return appRouter.createCaller({
    user: role
      ? { id: 1, openId: "app:1", role, email: "x@x.test", name: "X" }
      : null,
    req: new Request("http://localhost/api/trpc", {
      headers: { "x-forwarded-for": ip },
    }),
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as TrpcContext);
}

beforeEach(async () => {
  resetAllLimits();
  accounts.clear();
  accounts.set(1, {
    id: 1,
    email: "student@x.test",
    passwordHash: await hashPassword("right-password"),
    isActive: true,
  });
});

describe("role guards", () => {
  it.each(["mentor", "staff"])(
    "a %s cannot change courses or website settings",
    async role => {
      const caller = callerAs(role);
      await expect(caller.courses.delete({ id: 1 })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller.siteSettings.update([])).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    }
  );

  it("a mentor cannot see payments or reset student passwords", async () => {
    const caller = callerAs("mentor");
    await expect(caller.enrollments.adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller.students.resetPassword({ id: 2, password: "new-password-1" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("sign-in limits", () => {
  it("locks an email after 10 wrong passwords, even with the right one", async () => {
    for (let i = 0; i < 10; i++) {
      await expect(
        callerAs(null).auth.login({
          email: "student@x.test",
          password: "wrong",
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    await expect(
      callerAs(null).auth.login({
        email: "student@x.test",
        password: "right-password",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("locks an address after 30 failures across emails", async () => {
    for (let i = 0; i < 30; i++) {
      await expect(
        callerAs(null).auth.login({
          email: `nobody${i}@x.test`,
          password: "wrong",
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    await expect(
      callerAs(null).auth.login({ email: "other@x.test", password: "wrong" })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});

describe("sessions", () => {
  const requestWith = (token: string) =>
    new Request("http://localhost/", {
      headers: { cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}` },
    });

  it("end when the password changes", async () => {
    const token = await sessionService.createAppSessionToken(1);
    await expect(
      sessionService.authenticateRequest(requestWith(token))
    ).resolves.toMatchObject({ id: 1 });

    accounts.get(1)!.passwordHash = await hashPassword("new-password");
    await expect(
      sessionService.authenticateRequest(requestWith(token))
    ).rejects.toThrow();
  });
});
