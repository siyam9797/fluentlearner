import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("siteSettings.getAll (public)", () => {
  it("returns a key-value map of site settings", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.siteSettings.getAll();
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    // It's a Record<string, string | null>, not an array
    expect(Array.isArray(result)).toBe(false);
  });
});

describe("siteSettings.update (admin)", () => {
  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.siteSettings.update([{ key: "test_key", value: "test_value" }])
    ).rejects.toThrow();
  });
});
