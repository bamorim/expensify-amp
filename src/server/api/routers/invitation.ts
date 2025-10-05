import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const invitationRouter = createTRPCRouter({
  sendInvitation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          role: "ADMIN",
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can send invitations",
        });
      }

      const existingMember = await ctx.db.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          user: {
            email: input.email,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already a member of this organization",
        });
      }

      const existingInvitation = await ctx.db.invitation.findUnique({
        where: {
          email_organizationId: {
            email: input.email,
            organizationId: input.organizationId,
          },
        },
      });

      if (existingInvitation) {
        await ctx.db.invitation.delete({
          where: { id: existingInvitation.id },
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await ctx.db.invitation.create({
        data: {
          email: input.email,
          organizationId: input.organizationId,
          role: input.role,
          expiresAt,
        },
        include: {
          organization: true,
        },
      });

      // TODO: Send email with invitation link
      // For now, we'll just return the invitation token
      console.log(
        `Invitation link: ${process.env.NEXTAUTH_URL}/invitations/accept?token=${invitation.token}`,
      );

      return invitation;
    }),

  listPendingInvitations: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          role: "ADMIN",
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view invitations",
        });
      }

      const invitations = await ctx.db.invitation.findMany({
        where: {
          organizationId: input.organizationId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return invitations;
    }),

  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
        include: { organization: true },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.email || user.email !== invitation.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      const existingMember = await ctx.db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: ctx.session.user.id,
            organizationId: invitation.organizationId,
          },
        },
      });

      if (existingMember) {
        await ctx.db.invitation.delete({ where: { id: invitation.id } });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already a member of this organization",
        });
      }

      await ctx.db.organizationMember.create({
        data: {
          userId: ctx.session.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      await ctx.db.invitation.delete({ where: { id: invitation.id } });

      return { organization: invitation.organization };
    }),

  getInvitationDetails: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
        include: { organization: true },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      return invitation;
    }),
});
