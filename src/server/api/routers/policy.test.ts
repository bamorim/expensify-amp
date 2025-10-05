import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { db } from "~/server/db";
import { createCaller } from "~/server/api/root";
import { auth } from "~/server/auth";

describe("PolicyRouter", () => {
  let adminUserId: string;
  let memberUserId: string;
  let organizationId: string;
  let categoryId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    const adminUser = await db.user.create({
      data: {
        email: faker.internet.email(),
        name: "Admin User",
      },
    });
    adminUserId = adminUser.id;

    const memberUser = await db.user.create({
      data: {
        email: faker.internet.email(),
        name: "Member User",
      },
    });
    memberUserId = memberUser.id;

    const org = await db.organization.create({
      data: {
        name: faker.company.name(),
        members: {
          create: [
            { userId: adminUserId, role: "ADMIN" },
            { userId: memberUserId, role: "MEMBER" },
          ],
        },
      },
    });
    organizationId = org.id;

    const category = await db.expenseCategory.create({
      data: {
        name: "Travel",
        organizationId,
      },
    });
    categoryId = category.id;
  });

  describe("create", () => {
    it("should allow admins to create org-wide policies", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.create({
        organizationId,
        categoryId,
        maxAmount: 500,
        requiresReview: true,
      });

      expect(result.maxAmount).toBe(500);
      expect(result.requiresReview).toBe(true);
      expect(result.userId).toBeNull();
      expect(result.categoryId).toBe(categoryId);
    });

    it("should allow admins to create user-specific policies", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.create({
        organizationId,
        categoryId,
        userId: memberUserId,
        maxAmount: 1000,
        requiresReview: false,
      });

      expect(result.maxAmount).toBe(1000);
      expect(result.requiresReview).toBe(false);
      expect(result.userId).toBe(memberUserId);
      expect(result.user?.id).toBe(memberUserId);
    });

    it("should reject non-admins from creating policies", async () => {
      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.create({
          organizationId,
          categoryId,
          maxAmount: 500,
        }),
      ).rejects.toThrow("Only admins can create policies");
    });

    it("should reject creating policy for non-member user", async () => {
      const otherUser = await db.user.create({
        data: { email: faker.internet.email() },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.create({
          organizationId,
          categoryId,
          userId: otherUser.id,
          maxAmount: 500,
        }),
      ).rejects.toThrow("User is not a member of this organization");
    });

    it("should enforce unique constraint on category + user + org for user-specific policies", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await caller.policy.create({
        organizationId,
        categoryId,
        userId: memberUserId,
        maxAmount: 500,
      });

      await expect(
        caller.policy.create({
          organizationId,
          categoryId,
          userId: memberUserId,
          maxAmount: 600,
        }),
      ).rejects.toThrow("A policy already exists for this category and user combination");
    });
  });

  describe("list", () => {
    it("should allow members to list policies", async () => {
      const orgPolicy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
        },
      });

      const userPolicy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          userId: memberUserId,
          maxAmount: 1000,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.list({ organizationId });

      expect(result).toHaveLength(2);
      const orgPolicyResult = result.find((p) => p.id === orgPolicy.id);
      const userPolicyResult = result.find((p) => p.id === userPolicy.id);
      expect(orgPolicyResult?.userId).toBeNull();
      expect(userPolicyResult?.userId).toBe(memberUserId);
    });

    it("should reject non-members from listing policies", async () => {
      const otherUser = await db.user.create({
        data: { email: faker.internet.email() },
      });

      const mockSession = {
        user: { id: otherUser.id },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.list({ organizationId }),
      ).rejects.toThrow("Not a member of this organization");
    });
  });

  describe("update", () => {
    it("should allow admins to update policies", async () => {
      const policy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
        },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.update({
        id: policy.id,
        maxAmount: 750,
        requiresReview: false,
      });

      expect(result.maxAmount).toBe(750);
      expect(result.requiresReview).toBe(false);
    });

    it("should reject non-admins from updating policies", async () => {
      const policy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
        },
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.update({
          id: policy.id,
          maxAmount: 750,
        }),
      ).rejects.toThrow("Only admins can update policies");
    });
  });

  describe("delete", () => {
    it("should allow admins to delete policies", async () => {
      const policy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
        },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.delete({ id: policy.id });

      expect(result.success).toBe(true);

      const deletedPolicy = await db.policy.findUnique({
        where: { id: policy.id },
      });
      expect(deletedPolicy).toBeNull();
    });

    it("should reject non-admins from deleting policies", async () => {
      const policy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
        },
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.delete({ id: policy.id }),
      ).rejects.toThrow("Only admins can delete policies");
    });
  });

  describe("resolve", () => {
    it("should return user-specific policy when it exists", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
        },
      });

      const userPolicy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          userId: memberUserId,
          maxAmount: 1000,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.resolve({
        organizationId,
        categoryId,
        userId: memberUserId,
      });

      expect(result?.id).toBe(userPolicy.id);
      expect(result?.maxAmount).toBe(1000);
      expect(result?.requiresReview).toBe(false);
    });

    it("should return org-wide policy when no user-specific policy exists", async () => {
      const orgPolicy = await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
        },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.resolve({
        organizationId,
        categoryId,
        userId: memberUserId,
      });

      expect(result?.id).toBe(orgPolicy.id);
      expect(result?.maxAmount).toBe(500);
      expect(result?.requiresReview).toBe(true);
      expect(result?.userId).toBeNull();
    });

    it("should return null when no policy exists", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.policy.resolve({
        organizationId,
        categoryId,
        userId: memberUserId,
      });

      expect(result).toBeNull();
    });

    it("should reject non-members from resolving policies", async () => {
      const otherUser = await db.user.create({
        data: { email: faker.internet.email() },
      });

      const mockSession = {
        user: { id: otherUser.id },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.policy.resolve({
          organizationId,
          categoryId,
          userId: memberUserId,
        }),
      ).rejects.toThrow("Not a member of this organization");
    });
  });
});
