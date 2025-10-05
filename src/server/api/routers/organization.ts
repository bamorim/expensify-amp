import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  getOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: input.organizationId,
          },
        },
        include: {
          organization: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        ...membership.organization,
        currentUserRole: membership.role,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
        },
      });

      return organization;
    }),

  getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.organizationMember.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),

  listMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const members = await ctx.db.organizationMember.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
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

      return members;
    }),
});
