import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { db } from "~/server/db";
import { createCaller } from "~/server/api/root";
import { auth } from "~/server/auth";

describe("ExpenseRouter", () => {
  let userId: string;
  let organizationId: string;
  let categoryId: string;

  beforeEach(async () => {
    vi.clearAllMocks();

    const user = await db.user.create({
      data: {
        email: faker.internet.email(),
        name: "Test User",
      },
    });
    userId = user.id;

    const org = await db.organization.create({
      data: {
        name: faker.company.name(),
        members: {
          create: [{ userId, role: "MEMBER" }],
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

  describe("submit", () => {
    it("should auto-approve expense within limit when policy does not require review", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 400,
        date: new Date(),
        description: "Flight to NYC",
      });

      expect(result.status).toBe("APPROVED");
      expect(result.amount).toBe(400);
    });

    it("should auto-reject expense over policy limit", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 600,
        date: new Date(),
        description: "Expensive flight",
      });

      expect(result.status).toBe("REJECTED");
      expect(result.amount).toBe(600);
    });

    it("should mark as pending when policy requires review", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 400,
        date: new Date(),
        description: "Client dinner",
      });

      expect(result.status).toBe("PENDING");
      expect(result.amount).toBe(400);
    });

    it("should mark as pending when no policy exists", async () => {
      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 400,
        date: new Date(),
        description: "Misc expense",
      });

      expect(result.status).toBe("PENDING");
    });

    it("should use user-specific policy over org-wide policy", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: false,
        },
      });

      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          userId,
          maxAmount: 1000,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 750,
        date: new Date(),
        description: "Conference ticket",
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should reject expense over user-specific policy limit", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: false,
        },
      });

      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          userId,
          maxAmount: 300,
          requiresReview: false,
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 400,
        date: new Date(),
        description: "Expensive meal",
      });

      expect(result.status).toBe("REJECTED");
    });

    it("should reject non-members from submitting expenses", async () => {
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
        caller.expense.submit({
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Test",
        }),
      ).rejects.toThrow("Not a member of this organization");
    });
  });

  describe("listMy", () => {
    it("should list only user's own expenses", async () => {
      const otherUser = await db.user.create({
        data: {
          email: faker.internet.email(),
        },
      });

      await db.organizationMember.create({
        data: {
          userId: otherUser.id,
          organizationId,
          role: "MEMBER",
        },
      });

      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "My expense",
          status: "APPROVED",
        },
      });

      await db.expense.create({
        data: {
          userId: otherUser.id,
          organizationId,
          categoryId,
          amount: 200,
          date: new Date(),
          description: "Other user's expense",
          status: "APPROVED",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.listMy({ organizationId });

      expect(result).toHaveLength(1);
      expect(result[0]!.userId).toBe(userId);
      expect(result[0]!.description).toBe("My expense");
    });

    it("should reject non-members from listing expenses", async () => {
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
        caller.expense.listMy({ organizationId }),
      ).rejects.toThrow("Not a member of this organization");
    });
  });

  describe("listPending", () => {
    it("should list pending expenses for admins", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      await db.expense.createMany({
        data: [
          {
            userId,
            organizationId,
            categoryId,
            amount: 100,
            date: new Date(),
            description: "Pending expense 1",
            status: "PENDING",
          },
          {
            userId,
            organizationId,
            categoryId,
            amount: 200,
            date: new Date(),
            description: "Approved expense",
            status: "APPROVED",
          },
          {
            userId,
            organizationId,
            categoryId,
            amount: 300,
            date: new Date(),
            description: "Pending expense 2",
            status: "PENDING",
          },
        ],
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.listPending({ organizationId });

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.status === "PENDING")).toBe(true);
    });

    it("should reject non-admins from listing pending expenses", async () => {
      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.expense.listPending({ organizationId }),
      ).rejects.toThrow("Only admins can view pending expenses");
    });
  });

  describe("approve", () => {
    it("should approve pending expense as admin", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Pending expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.approve({ expenseId: expense.id });

      expect(result.status).toBe("APPROVED");
      expect(result.reviewedBy).toBe(userId);
      expect(result.reviewedAt).toBeTruthy();
    });

    it("should reject non-admins from approving expenses", async () => {
      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Pending expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.expense.approve({ expenseId: expense.id }),
      ).rejects.toThrow("Only admins can approve expenses");
    });

    it("should reject approving non-pending expenses", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Already approved",
          status: "APPROVED",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.expense.approve({ expenseId: expense.id }),
      ).rejects.toThrow("Only pending expenses can be approved");
    });
  });

  describe("reject", () => {
    it("should reject pending expense as admin with comment", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Pending expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.reject({
        expenseId: expense.id,
        comment: "Missing receipt",
      });

      expect(result.status).toBe("REJECTED");
      expect(result.reviewedBy).toBe(userId);
      expect(result.reviewedAt).toBeTruthy();
      expect(result.reviewComment).toBe("Missing receipt");
    });

    it("should reject pending expense without comment", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Pending expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.reject({ expenseId: expense.id });

      expect(result.status).toBe("REJECTED");
      expect(result.reviewedBy).toBe(userId);
      expect(result.reviewComment).toBeNull();
    });

    it("should reject non-admins from rejecting expenses", async () => {
      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Pending expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.expense.reject({ expenseId: expense.id }),
      ).rejects.toThrow("Only admins can reject expenses");
    });

    it("should reject rejecting non-pending expenses", async () => {
      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const expense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 100,
          date: new Date(),
          description: "Already approved",
          status: "APPROVED",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      await expect(
        caller.expense.reject({ expenseId: expense.id }),
      ).rejects.toThrow("Only pending expenses can be rejected");
    });
  });
});
