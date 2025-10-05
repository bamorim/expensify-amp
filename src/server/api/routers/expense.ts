import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { validateBudget } from "~/server/lib/budget-validation";

export const expenseRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        categoryId: z.string(),
        amount: z.number().positive(),
        date: z.date(),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this organization",
        });
      }

      const category = await ctx.db.expenseCategory.findFirst({
        where: {
          id: input.categoryId,
          organizationId: input.organizationId,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found in this organization",
        });
      }

      // Resolve applicable policy
      const policy = await ctx.db.policy.findFirst({
        where: {
          categoryId: input.categoryId,
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      const orgWidePolicy =
        !policy &&
        (await ctx.db.policy.findFirst({
          where: {
            categoryId: input.categoryId,
            userId: null,
            organizationId: input.organizationId,
          },
        }));

      const applicablePolicy = policy ?? orgWidePolicy;

      let status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";

      if (!applicablePolicy) {
        // No policy found - default to pending for manual review
        status = "PENDING";
      } else {
        const budgetValidation = await validateBudget(
          ctx.db,
          ctx.session.user.id,
          input.categoryId,
          input.organizationId,
          input.amount,
          input.date,
          applicablePolicy,
        );

        if (!budgetValidation.isValid) {
          // Over budget - auto-reject
          status = "REJECTED";
        } else if (applicablePolicy.requiresReview) {
          // Within budget but requires review
          status = "PENDING";
        } else {
          // Within budget and no review required - auto-approve
          status = "APPROVED";
        }
      }

      return ctx.db.expense.create({
        data: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          categoryId: input.categoryId,
          amount: input.amount,
          date: input.date,
          description: input.description,
          status,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  listMy: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this organization",
        });
      }

      return ctx.db.expense.findMany({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  listPending: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view pending expenses",
        });
      }

      return ctx.db.expense.findMany({
        where: {
          organizationId: input.organizationId,
          status: "PENDING",
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }),

  approve: protectedProcedure
    .input(z.object({ expenseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.expenseId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: expense.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can approve expenses",
        });
      }

      if (expense.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending expenses can be approved",
        });
      }

      // Check budget before approving
      const policy = await ctx.db.policy.findFirst({
        where: {
          categoryId: expense.categoryId,
          userId: expense.userId,
          organizationId: expense.organizationId,
        },
      });

      const orgWidePolicy =
        !policy &&
        (await ctx.db.policy.findFirst({
          where: {
            categoryId: expense.categoryId,
            userId: null,
            organizationId: expense.organizationId,
          },
        }));

      const applicablePolicy = policy ?? orgWidePolicy;

      if (applicablePolicy) {
        const budgetValidation = await validateBudget(
          ctx.db,
          expense.userId,
          expense.categoryId,
          expense.organizationId,
          expense.amount,
          expense.date,
          applicablePolicy,
          expense.id, // Exclude the current expense from budget calculation
        );

        if (!budgetValidation.isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Approving this expense would exceed the budget. Current spent: $${budgetValidation.currentSpent.toFixed(2)}, Limit: $${budgetValidation.limit.toFixed(2)}, This expense: $${expense.amount.toFixed(2)}`,
          });
        }
      }

      return ctx.db.expense.update({
        where: { id: input.expenseId },
        data: {
          status: "APPROVED",
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  reject: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.findUnique({
        where: { id: input.expenseId },
      });

      if (!expense) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: expense.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reject expenses",
        });
      }

      if (expense.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending expenses can be rejected",
        });
      }

      return ctx.db.expense.update({
        where: { id: input.expenseId },
        data: {
          status: "REJECTED",
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewComment: input.comment,
        },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),
});
