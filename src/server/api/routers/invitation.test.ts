import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { db } from "~/server/db";
import { invitationRouter } from "./invitation";

vi.mock("~/server/db");
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("InvitationRouter", () => {
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
        name: "Test Organization",
        members: {
          create: [
            {
              userId: adminUserId,
              role: "ADMIN",
            },
            {
              userId: memberUserId,
              role: "MEMBER",
            },
          ],
        },
      },
    });
    organizationId = org.id;
  });

  describe("sendInvitation", () => {
    it("should allow admins to send invitations", async () => {
      const caller = invitationRouter.createCaller({
        session: {
          user: { id: adminUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      const email = faker.internet.email();
      const result = await caller.sendInvitation({
        organizationId,
        email,
        role: "MEMBER",
      });

      expect(result.email).toEqual(email);
      expect(result.role).toEqual("MEMBER");
      expect(result.token).toBeDefined();
    });

    it("should reject non-admins from sending invitations", async () => {
      const caller = invitationRouter.createCaller({
        session: {
          user: { id: memberUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.sendInvitation({
          organizationId,
          email: faker.internet.email(),
          role: "MEMBER",
        }),
      ).rejects.toThrow("Only admins can send invitations");
    });

    it("should reject invitations for existing members", async () => {
      const existingUser = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "Existing User",
        },
      });

      await db.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId,
          role: "MEMBER",
        },
      });

      const caller = invitationRouter.createCaller({
        session: {
          user: { id: adminUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.sendInvitation({
          organizationId,
          email: existingUser.email!,
          role: "MEMBER",
        }),
      ).rejects.toThrow("User is already a member of this organization");
    });

    it("should replace existing pending invitation for same email", async () => {
      const caller = invitationRouter.createCaller({
        session: {
          user: { id: adminUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      const email = faker.internet.email();

      const first = await caller.sendInvitation({
        organizationId,
        email,
        role: "MEMBER",
      });

      const second = await caller.sendInvitation({
        organizationId,
        email,
        role: "ADMIN",
      });

      expect(second.id).not.toEqual(first.id);
      expect(second.role).toEqual("ADMIN");

      const existingInvitation = await db.invitation.findUnique({
        where: { id: first.id },
      });
      expect(existingInvitation).toBeNull();
    });
  });

  describe("acceptInvitation", () => {
    it("should allow users to accept valid invitations", async () => {
      const newUser = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "New User",
        },
      });

      const invitation = await db.invitation.create({
        data: {
          email: newUser.email!,
          organizationId,
          role: "MEMBER",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        include: {
          organization: true,
        },
      });

      const caller = invitationRouter.createCaller({
        session: {
          user: { id: newUser.id },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      const result = await caller.acceptInvitation({ token: invitation.token });

      expect(result.organization.id).toEqual(organizationId);

      const membership = await db.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: newUser.id,
            organizationId,
          },
        },
      });

      expect(membership).toBeDefined();
      expect(membership?.role).toEqual("MEMBER");

      const deletedInvitation = await db.invitation.findUnique({
        where: { id: invitation.id },
      });
      expect(deletedInvitation).toBeNull();
    });

    it("should reject expired invitations", async () => {
      const newUser = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "New User",
        },
      });

      const invitation = await db.invitation.create({
        data: {
          email: newUser.email!,
          organizationId,
          role: "MEMBER",
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const caller = invitationRouter.createCaller({
        session: {
          user: { id: newUser.id },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.acceptInvitation({ token: invitation.token }),
      ).rejects.toThrow("Invitation has expired");
    });

    it("should reject invitations for different email", async () => {
      const user1 = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "User 1",
        },
      });

      const user2 = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "User 2",
        },
      });

      const invitation = await db.invitation.create({
        data: {
          email: user1.email!,
          organizationId,
          role: "MEMBER",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const caller = invitationRouter.createCaller({
        session: {
          user: { id: user2.id },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.acceptInvitation({ token: invitation.token }),
      ).rejects.toThrow("This invitation was sent to a different email address");
    });
  });
});
