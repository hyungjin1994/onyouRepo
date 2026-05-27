import { RoutineCategory, TimeOfDay } from "@prisma/client";

export const TIME_OF_DAY_META: Record<
  TimeOfDay,
  { label: string; emoji: string; hours: string; order: number }
> = {
  [TimeOfDay.MORNING]:   { label: "아침", emoji: "🌅", hours: "6:00 - 11:00",  order: 0 },
  [TimeOfDay.AFTERNOON]: { label: "점심", emoji: "🌞", hours: "11:00 - 14:00", order: 1 },
  [TimeOfDay.EVENING]:   { label: "저녁", emoji: "🌆", hours: "17:00 - 21:00", order: 2 },
  [TimeOfDay.NIGHT]:     { label: "밤",   emoji: "🌙", hours: "21:00 - 24:00", order: 3 },
  [TimeOfDay.CUSTOM]:    { label: "기타", emoji: "⏰", hours: "사용자 지정",   order: 4 },
};

export const ROUTINE_CATEGORY_META: Record<
  RoutineCategory,
  { label: string; emoji: string; chipColor: string }
> = {
  [RoutineCategory.MEDICATION]: {
    label: "약 복용",
    emoji: "💊",
    chipColor: "bg-bg-pink text-foreground",
  },
  [RoutineCategory.EXERCISE]: {
    label: "운동",
    emoji: "💪",
    chipColor: "bg-bg-mint text-foreground",
  },
  [RoutineCategory.MINDSET]: {
    label: "마음",
    emoji: "🧘",
    chipColor: "bg-bg-lavender text-foreground",
  },
  [RoutineCategory.HYGIENE]: {
    label: "위생",
    emoji: "🚿",
    chipColor: "bg-bg-sky text-foreground",
  },
  [RoutineCategory.OTHER]: {
    label: "기타",
    emoji: "✨",
    chipColor: "bg-bg-yellow text-foreground",
  },
};

export const ROUTINE_CATEGORY_OPTIONS = (
  Object.entries(ROUTINE_CATEGORY_META) as [
    RoutineCategory,
    (typeof ROUTINE_CATEGORY_META)[RoutineCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "일" },
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
];
