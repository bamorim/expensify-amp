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

  describe("spend period budget validation", () => {
    it("should reject expense when MONTHLY budget would be exceeded", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 1000,
          requiresReview: false,
          spendPeriod: "MONTHLY",
        },
      });

      // Create an already approved expense for this month
      const thisMonth = new Date("2025-03-15T12:00:00Z");
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 700,
          date: thisMonth,
          description: "Already approved expense",
          status: "APPROVED",
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
        amount: 400, // Would exceed 1000 limit (700 + 400 = 1100)
        date: new Date("2025-03-20T12:00:00Z"),
        description: "Another expense this month",
      });

      expect(result.status).toBe("REJECTED");
    });

    it("should approve expense when MONTHLY budget is not exceeded", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 1000,
          requiresReview: false,
          spendPeriod: "MONTHLY",
        },
      });

      const thisMonth = new Date("2025-03-15T12:00:00Z");
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 700,
          date: thisMonth,
          description: "Already approved expense",
          status: "APPROVED",
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
        amount: 250, // Within limit (700 + 250 = 950)
        date: new Date("2025-03-20T12:00:00Z"),
        description: "Another expense this month",
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should not count expenses from previous month in MONTHLY budget", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 1000,
          requiresReview: false,
          spendPeriod: "MONTHLY",
        },
      });

      // Previous month expense
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 700,
          date: new Date("2025-02-15T12:00:00Z"),
          description: "Last month expense",
          status: "APPROVED",
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
        amount: 900, // Should be approved since previous month doesn't count
        date: new Date("2025-03-15T12:00:00Z"),
        description: "This month expense",
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should reject approval when WEEKLY budget would be exceeded", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
          spendPeriod: "WEEKLY",
        },
      });

      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      // Approved expense earlier this week
      const monday = new Date("2025-03-10T12:00:00Z");
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 300,
          date: monday,
          description: "Monday expense",
          status: "APPROVED",
        },
      });

      // Pending expense from same week
      const wednesday = new Date("2025-03-12T12:00:00Z");
      const pendingExpense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 250, // Would exceed limit (300 + 250 = 550)
          date: wednesday,
          description: "Wednesday expense",
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
        caller.expense.approve({ expenseId: pendingExpense.id }),
      ).rejects.toThrow("Approving this expense would exceed the budget");
    });

    it("should allow approval when WEEKLY budget is not exceeded", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 500,
          requiresReview: true,
          spendPeriod: "WEEKLY",
        },
      });

      await db.organizationMember.update({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
        data: { role: "ADMIN" },
      });

      const monday = new Date("2025-03-10T12:00:00Z");
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 300,
          date: monday,
          description: "Monday expense",
          status: "APPROVED",
        },
      });

      const wednesday = new Date("2025-03-12T12:00:00Z");
      const pendingExpense = await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 150, // Within limit (300 + 150 = 450)
          date: wednesday,
          description: "Wednesday expense",
          status: "PENDING",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      const result = await caller.expense.approve({
        expenseId: pendingExpense.id,
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should handle DAILY spend period correctly", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 200,
          requiresReview: false,
          spendPeriod: "DAILY",
        },
      });

      const today = new Date("2025-03-15T09:00:00Z");
      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 150,
          date: today,
          description: "Morning expense",
          status: "APPROVED",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });
      
      // Should reject - same day, would exceed
      const laterToday = new Date("2025-03-15T15:00:00Z");
      const rejected = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 100, // Would exceed 200 limit (150 + 100 = 250)
        date: laterToday,
        description: "Afternoon expense",
      });
      expect(rejected.status).toBe("REJECTED");

      // Should approve - different day
      const nextDay = new Date("2025-03-16T09:00:00Z");
      const approved = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 150,
        date: nextDay,
        description: "Next day expense",
      });
      expect(approved.status).toBe("APPROVED");
    });

    it("should handle YEARLY spend period correctly", async () => {
      await db.policy.create({
        data: {
          organizationId,
          categoryId,
          maxAmount: 10000,
          requiresReview: false,
          spendPeriod: "YEARLY",
        },
      });

      await db.expense.create({
        data: {
          userId,
          organizationId,
          categoryId,
          amount: 9000,
          date: new Date("2025-01-15T12:00:00Z"),
          description: "January expense",
          status: "APPROVED",
        },
      });

      const mockSession = {
        user: { id: userId },
        expires: "2030-12-31T23:59:59.999Z",
      };
      vi.mocked(auth).mockResolvedValue(mockSession);

      const caller = createCaller({ db, session: mockSession });

      // Should reject - same year, would exceed
      const laterInYear = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 2000, // Would exceed 10000 limit
        date: new Date("2025-11-15T12:00:00Z"),
        description: "November expense",
      });
      expect(laterInYear.status).toBe("REJECTED");

      // Should approve - next year
      const nextYear = await caller.expense.submit({
        organizationId,
        categoryId,
        amount: 5000,
        date: new Date("2026-01-15T12:00:00Z"),
        description: "Next year expense",
      });
      expect(nextYear.status).toBe("APPROVED");
    });
  });
});
