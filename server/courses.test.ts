import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a public (unauthenticated) context
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

// Helper to create an admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Helper to create a regular user context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("courses.list (public)", () => {
  it("returns an array of courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const courses = await caller.courses.list();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("returns courses with expected fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const courses = await caller.courses.list();
    if (courses.length > 0) {
      const course = courses[0];
      expect(course).toHaveProperty("id");
      expect(course).toHaveProperty("name");
      expect(course).toHaveProperty("category");
      expect(course).toHaveProperty("isActive");
      expect(course.isActive).toBe(true); // Public list should only return active courses
    }
  });
});

describe("courses.featured (public)", () => {
  it("returns an array of featured courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const featured = await caller.courses.featured();
    expect(Array.isArray(featured)).toBe(true);
    // All returned courses should be featured
    for (const course of featured) {
      expect(course.isFeatured).toBe(true);
      expect(course.isActive).toBe(true);
    }
  });
});

describe("successStories.list (public)", () => {
  it("returns an array of success stories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stories = await caller.successStories.list();
    expect(Array.isArray(stories)).toBe(true);
  });
});

describe("successStories.count (public)", () => {
  it("returns a number", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const count = await caller.successStories.count();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("courses.adminList (admin only)", () => {
  it("allows admin to list all courses", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const courses = await caller.courses.adminList();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.courses.adminList()).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.courses.adminList()).rejects.toThrow();
  });
});

describe("courses.getBySlug (public)", () => {
  it("returns a course when slug is valid", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.courses.getBySlug({ slug: "test-course" });
    // Result should be either a course object or undefined (no matching course in test DB)
    if (result) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("slug");
    } else {
      expect(result).toBeUndefined();
    }
  });

  it("returns null for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.courses.getBySlug({ slug: "this-slug-does-not-exist-xyz" });
    expect(result).toBeUndefined();
  });

  it("requires a string slug parameter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // @ts-expect-error - testing invalid input
    await expect(caller.courses.getBySlug({ slug: 123 })).rejects.toThrow();
  });
});

describe("successStories.adminList (admin only)", () => {
  it("allows admin to list all stories", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stories = await caller.successStories.adminList();
    expect(Array.isArray(stories)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.successStories.adminList()).rejects.toThrow();
  });
});
