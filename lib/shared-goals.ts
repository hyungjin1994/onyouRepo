import { GoalCategory } from "@prisma/client";

export const GOAL_CATEGORY_META: Record<
  GoalCategory,
  { label: string; emoji: string }
> = {
  [GoalCategory.FINANCE]:  { label: "재정",   emoji: "💰" },
  [GoalCategory.TRAVEL]:   { label: "여행",   emoji: "🏝" },
  [GoalCategory.LIFE]:     { label: "라이프", emoji: "🐕" },
  [GoalCategory.HEALTH]:   { label: "건강",   emoji: "💪" },
  [GoalCategory.LEARNING]: { label: "학습",   emoji: "📚" },
  [GoalCategory.OTHER]:    { label: "기타",   emoji: "✨" },
};

export const GOAL_CATEGORY_OPTIONS = (
  Object.entries(GOAL_CATEGORY_META) as [
    GoalCategory,
    (typeof GOAL_CATEGORY_META)[GoalCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));
