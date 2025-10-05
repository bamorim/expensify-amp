import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { SpendPeriod } from "@prisma/client";

export const policyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        categoryId: z.string(),
        userId: z.string().optional(),
        maxAmount: z.number().positive(),
        requiresReview: z.boolean().default(false),
        spendPeriod: z.nativeEnum(SpendPeriod).default("PER_EXPENSE"),
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

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create policies",
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

      if (input.userId) {
        const userMembership = await ctx.db.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: input.userId,
              organizationId: input.organizationId,
            },
          },
        });

        if (!userMembership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User is not a member of this organization",
          });
        }
      }

      // Check for existing policy to provide better error message
      const existingPolicy = await ctx.db.policy.findFirst({
        where: {
          categoryId: input.categoryId,
          userId: input.userId ?? null,
          organizationId: input.organizationId,
        },
      });

      if (existingPolicy) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A policy already exists for this category and user combination",
        });
      }

      try {
        return await ctx.db.policy.create({
          data: {
            organizationId: input.organizationId,
            categoryId: input.categoryId,
            userId: input.userId,
            maxAmount: input.maxAmount,
            requiresReview: input.requiresReview,
            spendPeriod: input.spendPeriod,
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
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Unique constraint")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A policy already exists for this category and user combination",
          });
        }
        throw error;
      }
    }),

  list: protectedProcedure
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

      return ctx.db.policy.findMany({
        where: { organizationId: input.organizationId },
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
        orderBy: [{ categoryId: "asc" }, { userId: "asc" }],
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        maxAmount: z.number().positive().optional(),
        requiresReview: z.boolean().optional(),
        spendPeriod: z.nativeEnum(SpendPeriod).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const policy = await ctx.db.policy.findUnique({
        where: { id: input.id },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: policy.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update policies",
        });
      }

      return ctx.db.policy.update({
        where: { id: input.id },
        data: {
          maxAmount: input.maxAmount,
          requiresReview: input.requiresReview,
          spendPeriod: input.spendPeriod,
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const policy = await ctx.db.policy.findUnique({
        where: { id: input.id },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: policy.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete policies",
        });
      }

      await ctx.db.policy.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  resolve: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        categoryId: z.string(),
        userId: z.string(),
      }),
    )
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

      const userSpecificPolicy = await ctx.db.policy.findFirst({
        where: {
          categoryId: input.categoryId,
          userId: input.userId,
          organizationId: input.organizationId,
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

      if (userSpecificPolicy) {
        return userSpecificPolicy;
      }

      const orgWidePolicy = await ctx.db.policy.findFirst({
        where: {
          categoryId: input.categoryId,
          userId: null,
          organizationId: input.organizationId,
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

      return orgWidePolicy;
    }),
});
