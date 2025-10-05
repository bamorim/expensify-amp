import { describe, it, expect, beforeEach, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { db } from "~/server/db";
import { organizationRouter } from "./organization";

vi.mock("~/server/db");
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("OrganizationRouter", () => {
  let testUserId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const user = await db.user.create({
      data: {
        email: faker.internet.email(),
        name: "Test User",
      },
    });
    testUserId = user.id;
  });

  describe("create", () => {
    it("should create an organization and add creator as admin", async () => {
      const mockSession = {
        user: { id: testUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = organizationRouter.createCaller({
        session: mockSession,
        db,
        headers: new Headers(),
      });

      const result = await caller.create({ name: "Test Organization" });

      expect(result.name).toEqual("Test Organization");

      const membership = await db.organizationMember.findFirst({
        where: {
          userId: testUserId,
          organizationId: result.id,
        },
      });

      expect(membership).toBeDefined();
      expect(membership?.role).toEqual("ADMIN");
    });
  });

  describe("getMyOrganizations", () => {
    it("should return all organizations for the user", async () => {
      const org1 = await db.organization.create({
        data: {
          name: "Org 1",
          members: {
            create: {
              userId: testUserId,
              role: "ADMIN",
            },
          },
        },
      });

      const org2 = await db.organization.create({
        data: {
          name: "Org 2",
          members: {
            create: {
              userId: testUserId,
              role: "MEMBER",
            },
          },
        },
      });

      const mockSession = {
        user: { id: testUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = organizationRouter.createCaller({
        session: mockSession,
        db,
        headers: new Headers(),
      });

      const result = await caller.getMyOrganizations();

      expect(result).toHaveLength(2);
      expect(result.find((o) => o.id === org1.id)?.role).toEqual("ADMIN");
      expect(result.find((o) => o.id === org2.id)?.role).toEqual("MEMBER");
    });

    it("should not return organizations user is not a member of", async () => {
      const otherUser = await db.user.create({
        data: {
          email: "other@example.com",
          name: "Other User",
        },
      });

      await db.organization.create({
        data: {
          name: "Other Org",
          members: {
            create: {
              userId: otherUser.id,
              role: "ADMIN",
            },
          },
        },
      });

      const mockSession = {
        user: { id: testUserId },
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = organizationRouter.createCaller({
        session: mockSession,
        db,
        headers: new Headers(),
      });

      const result = await caller.getMyOrganizations();

      expect(result).toHaveLength(0);
    });
  });

  describe("getOrganization", () => {
    it("should return organization with current user role", async () => {
      const org = await db.organization.create({
        data: {
          name: "Test Org",
          members: {
            create: {
              userId: testUserId,
              role: "MEMBER",
            },
          },
        },
      });

      const caller = organizationRouter.createCaller({
        session: {
          user: { id: testUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      const result = await caller.getOrganization({ organizationId: org.id });

      expect(result.id).toEqual(org.id);
      expect(result.name).toEqual("Test Org");
      expect(result.currentUserRole).toEqual("MEMBER");
    });

    it("should reject non-members", async () => {
      const otherUser = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "Other User",
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          members: {
            create: {
              userId: otherUser.id,
              role: "ADMIN",
            },
          },
        },
      });

      const caller = organizationRouter.createCaller({
        session: {
          user: { id: testUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.getOrganization({ organizationId: org.id }),
      ).rejects.toThrow("You are not a member of this organization");
    });
  });

  describe("listMembers", () => {
    it("should allow members to view organization members", async () => {
      const user2 = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "User 2",
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          members: {
            create: [
              {
                userId: testUserId,
                role: "ADMIN",
              },
              {
                userId: user2.id,
                role: "MEMBER",
              },
            ],
          },
        },
      });

      const caller = organizationRouter.createCaller({
        session: {
          user: { id: testUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      const result = await caller.listMembers({ organizationId: org.id });

      expect(result).toHaveLength(2);
      expect(result[0]?.userId).toEqual(testUserId);
      expect(result[0]?.role).toEqual("ADMIN");
      expect(result[1]?.userId).toEqual(user2.id);
      expect(result[1]?.role).toEqual("MEMBER");
    });

    it("should reject non-members from viewing members", async () => {
      const otherUser = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: "Other User",
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          members: {
            create: {
              userId: otherUser.id,
              role: "ADMIN",
            },
          },
        },
      });

      const caller = organizationRouter.createCaller({
        session: {
          user: { id: testUserId },
          expires: "2030-12-31T23:59:59.999Z",
        },
        db,
        headers: new Headers(),
      });

      await expect(
        caller.listMembers({ organizationId: org.id }),
      ).rejects.toThrow("You are not a member of this organization");
    });
  });
});
