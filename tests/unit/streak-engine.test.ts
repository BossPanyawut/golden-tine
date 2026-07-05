import { describe, expect, it } from "vitest";
import { computeStreak, isScheduledDay } from "@/server/services/streak-engine";

const day = (s: string) => new Date(`${s}T12:00:00Z`);

describe("isScheduledDay", () => {
  it("daily is always scheduled", () => {
    expect(isScheduledDay({ kind: "daily" }, day("2026-07-05"))).toBe(true);
  });

  it("weekly only matches configured weekdays", () => {
    // 2026-07-05 is a Sunday
    const recurrence = { kind: "weekly" as const, daysOfWeek: [1, 3, 5] }; // Mon/Wed/Fri
    expect(isScheduledDay(recurrence, day("2026-07-05"))).toBe(false);
    expect(isScheduledDay(recurrence, day("2026-07-06"))).toBe(true); // Monday
  });

  it("monthly only matches the configured day of month", () => {
    const recurrence = { kind: "monthly" as const, dayOfMonth: 15 };
    expect(isScheduledDay(recurrence, day("2026-07-15"))).toBe(true);
    expect(isScheduledDay(recurrence, day("2026-07-16"))).toBe(false);
  });
});

describe("computeStreak — daily", () => {
  const recurrence = { kind: "daily" as const };

  it("counts consecutive completed days ending yesterday, today not yet done", () => {
    const today = day("2026-07-05");
    const completed = ["2026-07-02", "2026-07-03", "2026-07-04"];
    const result = computeStreak(recurrence, completed, today);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it("includes today when today is completed", () => {
    const today = day("2026-07-05");
    const completed = ["2026-07-03", "2026-07-04", "2026-07-05"];
    const result = computeStreak(recurrence, completed, today);
    expect(result.current).toBe(3);
  });

  it("resets current streak after a missed day, but keeps longest", () => {
    const today = day("2026-07-05");
    const completed = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-07-04"];
    const result = computeStreak(recurrence, completed, today);
    expect(result.current).toBe(1); // just yesterday
    expect(result.longest).toBe(3); // the June run
  });

  it("is zero when nothing has ever been completed", () => {
    const result = computeStreak(recurrence, [], day("2026-07-05"));
    expect(result).toEqual({ current: 0, longest: 0 });
  });
});

describe("computeStreak — weekly", () => {
  it("only counts scheduled weekdays toward the streak", () => {
    // Mon/Wed/Fri habit; today is Sunday 2026-07-05.
    const recurrence = { kind: "weekly" as const, daysOfWeek: [1, 3, 5] };
    const today = day("2026-07-05");
    // Previous Mon/Wed/Fri (06-29, 07-01, 07-03) all completed.
    const completed = ["2026-06-29", "2026-07-01", "2026-07-03"];
    const result = computeStreak(recurrence, completed, today);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });
});
