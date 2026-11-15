import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppRole } from "@shared/roles";
import type { TrpcContext } from "./_core/context";

type Account = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  avatarUrl: string | null;
};
const accounts = new Map<number, Account>();

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getAppUserById: vi.fn(async (id: number) => accounts.get(id)),
  updateAppUserAvatar: vi.fn(async (id: number, url: string | null) => {
    accounts.get(id)!.avatarUrl = url;
  }),
}));

const changeUserEmail = vi.fn(async (id: number, email: string) => {
  accounts.get(id)!.email = email;
});
const updateUser = vi.fn(async (id: number, values: { name?: string }) => {
  if (values.name) accounts.get(id)!.name = values.name;
});
vi.mock("./mockDb", async importOriginal => ({
  ...(await importOriginal<typeof import("./mockDb")>()),
  changeUserEmail: (id: number, email: string) => changeUserEmail(id, email),
  updateUser: (id: number, values: { name?: string }) => updateUser(id, values),
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

const ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "marketing",
  "staff",
  "mentor",
  "student",
];
const png = Buffer.from("fake image bytes").toString("base64");

function callerAs(id: number, role: AppRole, openId = `app:${id}`) {
  return appRouter.createCaller({
    user: { id, openId, role, email: `${role}@x.test`, name: role },
  } as unknown as TrpcContext);
}

beforeEach(() => {
  accounts.clear();
  changeUserEmail.mockClear();
  updateUser.mockClear();
  storagePut.mockClear();
  ROLES.forEach((role, index) =>
    accounts.set(index + 1, {
      id: index + 1,
      name: `Old ${role}`,
      email: `${role}@x.test`,
      role,
      avatarUrl: null,
    })
  );
});

describe("auth.myProfile", () => {
  it("reads name, email and photo from the account, like the Users page", async () => {
    accounts.get(2)!.avatarUrl = "/uploads/avatars/2.png";
    await expect(callerAs(2, "admin").auth.myProfile()).resolves.toEqual({
      name: "Old admin",
      email: "admin@x.test",
      avatarUrl: "/uploads/avatars/2.png",
      canEditEmail: false,
    });
  });

  it("allows email editing for the Super Admin only", async () => {
    for (const [index, role] of ROLES.entries()) {
      const profile = await callerAs(index + 1, role).auth.myProfile();
      expect(profile.canEditEmail).toBe(role === "super_admin");
    }
  });

  it("requires sign-in", async () => {
    const caller = appRouter.createCaller({ user: null } as TrpcContext);
    await expect(caller.auth.myProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("auth.updateProfile", () => {
  it.each(ROLES.map((role, index) => [role, index + 1] as const))(
    "lets a %s rename themselves",
    async (role, id) => {
      await callerAs(id, role).auth.updateProfile({ name: "New Name" });
      expect(accounts.get(id)!.name).toBe("New Name");
    }
  );

  it("lets the Super Admin change their own email (normalised)", async () => {
    await callerAs(1, "super_admin").auth.updateProfile({
      email: " Boss@X.test ",
    });
    expect(changeUserEmail).toHaveBeenCalledWith(1, "boss@x.test");
  });

  it.each(ROLES.slice(1).map((role, index) => [role, index + 2] as const))(
    "stops a %s changing their own email",
    async (role, id) => {
      await expect(
        callerAs(id, role).auth.updateProfile({ email: "new@x.test" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(changeUserEmail).not.toHaveBeenCalled();
    }
  );

  it("treats re-sending the current email as no change", async () => {
    await callerAs(2, "admin").auth.updateProfile({
      name: "Renamed",
      email: "admin@x.test",
    });
    expect(changeUserEmail).not.toHaveBeenCalled();
    expect(accounts.get(2)!.name).toBe("Renamed");
  });

  it("refuses the development login", async () => {
    await expect(
      callerAs(0, "super_admin", "local:admin").auth.updateProfile({
        name: "X",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("auth.updateAvatar", () => {
  it.each(ROLES.map((role, index) => [role, index + 1] as const))(
    "saves a %s photo to the account",
    async (role, id) => {
      const caller = callerAs(id, role);
      const { avatarUrl } = await caller.auth.updateAvatar({
        base64: png,
        filename: "Me.PNG",
        contentType: "image/png",
      });
      expect(avatarUrl).toMatch(
        new RegExp(`^/uploads/avatars/${id}-[\\w-]+\\.png$`)
      );
      expect((await caller.auth.myProfile()).avatarUrl).toBe(avatarUrl);
    }
  );

  it("removes the photo", async () => {
    accounts.get(2)!.avatarUrl = "/uploads/avatars/old.png";
    await callerAs(2, "admin").auth.updateAvatar({ remove: true });
    expect(accounts.get(2)!.avatarUrl).toBeNull();
  });

  it("rejects files that aren't images", async () => {
    await expect(
      callerAs(2, "admin").auth.updateAvatar({
        base64: png,
        filename: "notes.pdf",
        contentType: "application/pdf",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("refuses the development login", async () => {
    await expect(
      callerAs(0, "super_admin", "local:admin").auth.updateAvatar({
        base64: png,
        filename: "me.png",
        contentType: "image/png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
