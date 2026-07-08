// EXP awarded per completion, by priority (tasks) or a flat rate (habits).
export const TASK_EXP: Record<"low" | "medium" | "high", number> = {
  low: 5,
  medium: 10,
  high: 20,
};

export const HABIT_EXP = 10;

// Level curve: level N requires a cumulative total of BASE * (N-1) * N / 2
// EXP — i.e. level 2 at 100, level 3 at 300, level 4 at 600… Each level costs
// BASE more than the previous, a gentle quadratic ramp.
const BASE = 100;

export function totalExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (BASE * (level - 1) * level) / 2;
}

export interface LevelProgress {
  level: number;
  currentLevelExp: number; // EXP earned within the current level
  nextLevelExp: number; // EXP needed to span the current level
  totalExp: number;
}

export function levelFromExp(totalExp: number): LevelProgress {
  const exp = Math.max(0, Math.floor(totalExp));
  let level = 1;
  while (totalExpForLevel(level + 1) <= exp) {
    level += 1;
  }
  const floor = totalExpForLevel(level);
  const ceil = totalExpForLevel(level + 1);
  return {
    level,
    currentLevelExp: exp - floor,
    nextLevelExp: ceil - floor,
    totalExp: exp,
  };
}
