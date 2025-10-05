import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const categoryRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
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
          message: "Only admins can create categories",
        });
      }

      return ctx.db.expenseCategory.create({
        data: {
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
        },
      });
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

      return ctx.db.expenseCategory.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { name: "asc" },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.expenseCategory.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: category.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update categories",
        });
      }

      return ctx.db.expenseCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.expenseCategory.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: category.organizationId,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete categories",
        });
      }

      await ctx.db.expenseCategory.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
