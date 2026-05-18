import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ============================================
// COURSES TESTS
// ============================================
describe("courses", () => {
  it("public can list active courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const courses = await caller.courses.list();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("public can get featured courses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const courses = await caller.courses.featured();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("admin can list all courses", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const courses = await caller.courses.adminList();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("non-admin cannot access admin course list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.courses.adminList()).rejects.toThrow();
  });

  it("admin can create a course", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.courses.create({
      name: "Test IELTS Course",
      category: "ielts",
      level: "all",
      sortOrder: 99,
      isActive: true,
      isFeatured: false,
    });
    expect(result).toBeDefined();
  });
});

// ============================================
// PAYMENT SETTINGS TESTS
// ============================================
describe("paymentSettings", () => {
  it("public can get active payment methods", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const settings = await caller.paymentSettings.active();
    expect(Array.isArray(settings)).toBe(true);
  });

  it("admin can list all payment settings", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const settings = await caller.paymentSettings.adminList();
    expect(Array.isArray(settings)).toBe(true);
  });

  it("non-admin cannot access admin payment settings", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.paymentSettings.adminList()).rejects.toThrow();
  });

  it("admin can create a payment method", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.paymentSettings.create({
      methodName: "bKash",
      accountNumber: "01729879855",
      accountType: "Personal",
      accountHolder: "Test User",
      instructions: "Send money to this number",
      sortOrder: 1,
      isActive: true,
    });
    expect(result).toBeDefined();
  });
});

// ============================================
// BATCHES TESTS
// ============================================
describe("batches", () => {
  it("public can get active batches", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const batches = await caller.batches.active();
    expect(Array.isArray(batches)).toBe(true);
  });

  it("admin can list all batches", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const batches = await caller.batches.adminList();
    expect(Array.isArray(batches)).toBe(true);
  });

  it("non-admin cannot access admin batch list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.batches.adminList()).rejects.toThrow();
  });

  it("admin can create a batch", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.batches.create({
      name: "Test Batch March 2026",
      maxCapacity: 30,
      isOpen: true,
      isActive: true,
    });
    expect(result).toBeDefined();
  });
});

// ============================================
// ENROLLMENTS TESTS
// ============================================
describe("enrollments", () => {
  it("admin can get enrollment stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.enrollments.stats();
    expect(stats).toBeDefined();
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.verified).toBe("number");
    expect(typeof stats.rejected).toBe("number");
    expect(typeof stats.total).toBe("number");
  });

  it("admin can list all enrollments", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const enrollments = await caller.enrollments.adminList();
    expect(Array.isArray(enrollments)).toBe(true);
  });

  it("admin can filter enrollments by status", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const pending = await caller.enrollments.adminList({ status: "pending" });
    expect(Array.isArray(pending)).toBe(true);
  });

  it("non-admin cannot access enrollment admin list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.enrollments.adminList()).rejects.toThrow();
  });

  it("non-admin cannot access enrollment stats", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.enrollments.stats()).rejects.toThrow();
  });
});

// ============================================
// SUCCESS STORIES TESTS
// ============================================
describe("successStories", () => {
  it("public can list active success stories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stories = await caller.successStories.list();
    expect(Array.isArray(stories)).toBe(true);
  });

  it("public can get featured success stories", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const stories = await caller.successStories.featured();
    expect(Array.isArray(stories)).toBe(true);
  });

  it("public can get success stories count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const count = await caller.successStories.count();
    expect(typeof count).toBe("number");
  });

  it("admin can list all success stories", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stories = await caller.successStories.adminList();
    expect(Array.isArray(stories)).toBe(true);
  });

  it("non-admin cannot access admin success stories list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.successStories.adminList()).rejects.toThrow();
  });
});
