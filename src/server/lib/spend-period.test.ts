import { describe, it, expect } from "vitest";
import { getSpendPeriodDateRange } from "./spend-period";

describe("getSpendPeriodDateRange", () => {
  it("should return the same date for PER_EXPENSE", () => {
    const date = new Date("2025-03-15T12:00:00Z");
    const { start, end } = getSpendPeriodDateRange(date, "PER_EXPENSE");
    expect(start).toEqual(date);
    expect(end).toEqual(date);
  });

  it("should return start and end of day for DAILY", () => {
    const date = new Date("2025-03-15T12:00:00Z");
    const { start, end } = getSpendPeriodDateRange(date, "DAILY");
    
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
    
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("should return Monday to Sunday for WEEKLY (when date is Wednesday)", () => {
    const wednesday = new Date("2025-03-12T12:00:00Z"); // March 12, 2025 is a Wednesday
    const { start, end } = getSpendPeriodDateRange(wednesday, "WEEKLY");
    
    // Start should be Monday, March 10
    expect(start.getDate()).toBe(10);
    expect(start.getMonth()).toBe(2); // March (0-indexed)
    expect(start.getHours()).toBe(0);
    
    // End should be Sunday, March 16
    expect(end.getDate()).toBe(16);
    expect(end.getMonth()).toBe(2);
    expect(end.getHours()).toBe(23);
  });

  it("should return Monday to Sunday for WEEKLY (when date is Monday)", () => {
    const monday = new Date("2025-03-10T12:00:00Z"); // March 10, 2025 is a Monday
    const { start, end } = getSpendPeriodDateRange(monday, "WEEKLY");
    
    // Start should be the same Monday
    expect(start.getDate()).toBe(10);
    expect(start.getMonth()).toBe(2);
    
    // End should be Sunday, March 16
    expect(end.getDate()).toBe(16);
    expect(end.getMonth()).toBe(2);
  });

  it("should return Monday to Sunday for WEEKLY (when date is Sunday)", () => {
    const sunday = new Date("2025-03-16T12:00:00Z"); // March 16, 2025 is a Sunday
    const { start, end } = getSpendPeriodDateRange(sunday, "WEEKLY");
    
    // Start should be Monday, March 10
    expect(start.getDate()).toBe(10);
    expect(start.getMonth()).toBe(2);
    
    // End should be the same Sunday
    expect(end.getDate()).toBe(16);
    expect(end.getMonth()).toBe(2);
  });

  it("should return start and end of month for MONTHLY", () => {
    const date = new Date("2025-03-15T12:00:00Z");
    const { start, end } = getSpendPeriodDateRange(date, "MONTHLY");
    
    // Start should be March 1
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(2);
    expect(start.getHours()).toBe(0);
    
    // End should be March 31
    expect(end.getDate()).toBe(31);
    expect(end.getMonth()).toBe(2);
    expect(end.getHours()).toBe(23);
  });

  it("should handle February correctly for MONTHLY", () => {
    const date = new Date("2025-02-15T12:00:00Z");
    const { start, end } = getSpendPeriodDateRange(date, "MONTHLY");
    
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(1); // February
    
    // 2025 is not a leap year, so February has 28 days
    expect(end.getDate()).toBe(28);
    expect(end.getMonth()).toBe(1);
  });

  it("should handle leap year February for MONTHLY", () => {
    const date = new Date("2024-02-15T12:00:00Z"); // 2024 is a leap year
    const { start, end } = getSpendPeriodDateRange(date, "MONTHLY");
    
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(1);
    
    // 2024 is a leap year, so February has 29 days
    expect(end.getDate()).toBe(29);
    expect(end.getMonth()).toBe(1);
  });

  it("should return start and end of year for YEARLY", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    const { start, end } = getSpendPeriodDateRange(date, "YEARLY");
    
    // Start should be January 1
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(0);
    expect(start.getFullYear()).toBe(2025);
    expect(start.getHours()).toBe(0);
    
    // End should be December 31
    expect(end.getDate()).toBe(31);
    expect(end.getMonth()).toBe(11);
    expect(end.getFullYear()).toBe(2025);
    expect(end.getHours()).toBe(23);
  });
});
