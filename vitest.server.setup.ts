import { vi } from "vitest";

// Mock the database for all server tests
vi.mock("~/server/db");

// Mock auth for all server tests
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));
