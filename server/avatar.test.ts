import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const avatars = new Map<number, string | null>();

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAppUserById: vi.fn(async (id: number) =>
    avatars.has(id) ? { id, avatarUrl: avatars.get(id) } : undefined
  ),
  updateAppUserAvatar: vi.fn(async (id: number, url: string | null) => {
    avatars.set(id, url);
  }),
}));

const storagePut = vi.fn(async (key: string) => ({
  key,
  url: `/${key}`,
  size: 1,
}));
vi.mock("./storage", async importOriginal => ({
  ...(await importOriginal<typeof import("./storage")>()),
  storagePut: (key: string) => storagePut(key),
}));

const { appRouter } = await import("./routers");

const png = Buffer.from("fake image bytes").toString("base64");

function callerAs(id: number, role: string, openId = `app:${id}`) {
  return appRouter.createCaller({
    user: { id, openId, role, email: "a@x.test", name: "A" },
  } as unknown as TrpcContext);
}

describe("auth.updateAvatar / auth.myAvatar", () => {
  beforeEach(() => {
    avatars.clear();
    avatars.set(5, null);
    storagePut.mockClear();
  });

  it.each(["super_admin", "admin", "staff", "mentor", "marketing", "student"])(
    "saves a %s photo to the account so the Users page can show it",
    async role => {
      const caller = callerAs(5, role);
      const { avatarUrl } = await caller.auth.updateAvatar({
        base64: png,
        filename: "Me.PNG",
        contentType: "image/png",
      });
      expect(avatarUrl).toMatch(/^\/uploads\/avatars\/5-[\w-]+\.png$/);
      expect(avatars.get(5)).toBe(avatarUrl);
      await expect(caller.auth.myAvatar()).resolves.toEqual({ avatarUrl });
    }
  );

  it("removes the photo", async () => {
    avatars.set(5, "/uploads/avatars/old.png");
    await callerAs(5, "admin").auth.updateAvatar({ remove: true });
    expect(avatars.get(5)).toBeNull();
  });

  it("rejects files that aren't images", async () => {
    await expect(
      callerAs(5, "admin").auth.updateAvatar({
        base64: png,
        filename: "notes.pdf",
        contentType: "application/pdf",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("refuses the development login, which has no account row", async () => {
    await expect(
      callerAs(0, "super_admin", "local:admin").auth.updateAvatar({
        base64: png,
        filename: "me.png",
        contentType: "image/png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      callerAs(0, "super_admin", "local:admin").auth.myAvatar()
    ).resolves.toEqual({ avatarUrl: null });
  });

  it("requires sign-in", async () => {
    const caller = appRouter.createCaller({ user: null } as TrpcContext);
    await expect(caller.auth.myAvatar()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
