import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { db } from "~/server/db";
import { createCaller } from "~/server/api/root";
import { auth } from "~/server/auth";

describe("CategoryRouter", () => {
  let adminUserId: string;
  let memberUserId: string;
  let organizationId: string;

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
  });

  describe("create", () => {
    it("should allow admins to create categories", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.category.create({
        organizationId,
        name: "Travel",
        description: "Travel expenses",
      });

      expect(result.name).toBe("Travel");
      expect(result.description).toBe("Travel expenses");
      expect(result.organizationId).toBe(organizationId);
    });

    it("should reject non-admins from creating categories", async () => {
      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.category.create({
          organizationId,
          name: "Travel",
        }),
      ).rejects.toThrow("Only admins can create categories");
    });

    it("should enforce unique category names per organization", async () => {
      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await caller.category.create({
        organizationId,
        name: "Travel",
      });

      await expect(
        caller.category.create({
          organizationId,
          name: "Travel",
        }),
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should allow members to list categories", async () => {
      await db.expenseCategory.createMany({
        data: [
          { name: "Travel", organizationId },
          { name: "Food", organizationId },
        ],
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.category.list({ organizationId });

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Food");
      expect(result[1]!.name).toBe("Travel");
    });

    it("should reject non-members from listing categories", async () => {
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
        caller.category.list({ organizationId }),
      ).rejects.toThrow("Not a member of this organization");
    });
  });

  describe("update", () => {
    it("should allow admins to update categories", async () => {
      const category = await db.expenseCategory.create({
        data: { name: "Travel", organizationId },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.category.update({
        id: category.id,
        name: "Travel & Transportation",
        description: "All travel-related expenses",
      });

      expect(result.name).toBe("Travel & Transportation");
      expect(result.description).toBe("All travel-related expenses");
    });

    it("should reject non-admins from updating categories", async () => {
      const category = await db.expenseCategory.create({
        data: { name: "Travel", organizationId },
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.category.update({
          id: category.id,
          name: "Updated",
        }),
      ).rejects.toThrow("Only admins can update categories");
    });
  });

  describe("delete", () => {
    it("should allow admins to delete categories", async () => {
      const category = await db.expenseCategory.create({
        data: { name: "Travel", organizationId },
      });

      const mockSession = {
        user: { id: adminUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.category.delete({ id: category.id });

      expect(result.success).toBe(true);

      const deletedCategory = await db.expenseCategory.findUnique({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it("should reject non-admins from deleting categories", async () => {
      const category = await db.expenseCategory.create({
        data: { name: "Travel", organizationId },
      });

      const mockSession = {
        user: { id: memberUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.category.delete({ id: category.id }),
      ).rejects.toThrow("Only admins can delete categories");
    });
  });
});
