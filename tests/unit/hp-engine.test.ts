import { describe, expect, it } from "vitest";
import { computeHp, missedDaysSince, MAX_HP } from "@/server/services/hp-engine";

const day = (s: string) => new Date(`${s}T12:00:00Z`);

describe("computeHp", () => {
  it("full HP when nothing is missed", () => {
    expect(computeHp([])).toBe(MAX_HP);
    expect(computeHp([{ missedScheduledDays: 0 }])).toBe(MAX_HP);
  });

  it("grace period absorbs the first missed day", () => {
    expect(computeHp([{ missedScheduledDays: 1 }])).toBe(MAX_HP);
  });

  it("drains 10 HP per missed day past the grace period", () => {
    expect(computeHp([{ missedScheduledDays: 2 }])).toBe(90);
    expect(computeHp([{ missedScheduledDays: 4 }])).toBe(70);
  });

  it("sums penalties across multiple neglected habits", () => {
    expect(
      computeHp([{ missedScheduledDays: 3 }, { missedScheduledDays: 2 }])
    ).toBe(70); // (3-1)*10 + (2-1)*10 = 30 penalty
  });

  it("never drops below 0", () => {
    expect(computeHp([{ missedScheduledDays: 100 }])).toBe(0);
  });
});

describe("missedDaysSince", () => {
  it("counts scheduled occurrences when never completed, capped", () => {
    expect(missedDaysSince(null, day("2026-07-08"), 3)).toBe(3);
    expect(missedDaysSince(null, day("2026-07-08"), 20, 5)).toBe(5);
  });

  it("is zero when completed today", () => {
    expect(missedDaysSince(day("2026-07-08"), day("2026-07-08"), 0)).toBe(0);
  });

  it("counts occurrences since last completion, capped", () => {
    expect(missedDaysSince(day("2026-07-01"), day("2026-07-08"), 4)).toBe(4);
    expect(missedDaysSince(day("2026-07-01"), day("2026-07-08"), 9, 5)).toBe(5);
  });
});
