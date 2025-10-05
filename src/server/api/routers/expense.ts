import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

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
      } else if (input.amount > applicablePolicy.maxAmount) {
        // Over limit - auto-reject
        status = "REJECTED";
      } else if (applicablePolicy.requiresReview) {
        // Within limit but requires review
        status = "PENDING";
      } else {
        // Within limit and no review required - auto-approve
        status = "APPROVED";
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
});
