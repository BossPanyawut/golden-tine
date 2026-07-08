import { describe, expect, it } from "vitest";
import { levelFromExp, totalExpForLevel } from "@/server/services/exp-engine";

describe("totalExpForLevel", () => {
  it("level 1 costs 0", () => {
    expect(totalExpForLevel(1)).toBe(0);
  });

  it("follows the quadratic ramp: 100, 300, 600, 1000", () => {
    expect(totalExpForLevel(2)).toBe(100);
    expect(totalExpForLevel(3)).toBe(300);
    expect(totalExpForLevel(4)).toBe(600);
    expect(totalExpForLevel(5)).toBe(1000);
  });
});

describe("levelFromExp", () => {
  it("0 exp is level 1", () => {
    const p = levelFromExp(0);
    expect(p.level).toBe(1);
    expect(p.currentLevelExp).toBe(0);
    expect(p.nextLevelExp).toBe(100);
  });

  it("just below a threshold stays on the lower level", () => {
    expect(levelFromExp(99).level).toBe(1);
    expect(levelFromExp(299).level).toBe(2);
  });

  it("exactly on a threshold advances", () => {
    expect(levelFromExp(100).level).toBe(2);
    expect(levelFromExp(300).level).toBe(3);
  });

  it("reports progress within the current level", () => {
    const p = levelFromExp(150); // level 2 (floor 100, ceil 300)
    expect(p.level).toBe(2);
    expect(p.currentLevelExp).toBe(50);
    expect(p.nextLevelExp).toBe(200);
  });

  it("clamps negative/garbage input to level 1", () => {
    expect(levelFromExp(-50).level).toBe(1);
    expect(levelFromExp(-50).totalExp).toBe(0);
  });
});
