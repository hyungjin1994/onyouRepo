import { SharedEventCategory } from "@prisma/client";

export const SHARED_EVENT_CATEGORY_META: Record<
  SharedEventCategory,
  { label: string; emoji: string; chipColor: string }
> = {
  [SharedEventCategory.DATE]:          { label: "데이트",   emoji: "💑", chipColor: "bg-bg-pink" },
  [SharedEventCategory.FAMILY]:        { label: "가족 모임", emoji: "👨‍👩‍👧", chipColor: "bg-bg-peach" },
  [SharedEventCategory.ANNIVERSARY]:   { label: "기념일",   emoji: "🎂", chipColor: "bg-bg-yellow" },
  [SharedEventCategory.MEDICAL]:       { label: "병원",     emoji: "🏥", chipColor: "bg-bg-mint" },
  [SharedEventCategory.ENTERTAINMENT]: { label: "공연",     emoji: "🎬", chipColor: "bg-bg-lavender" },
  [SharedEventCategory.TRAVEL]:        { label: "여행",     emoji: "✈️", chipColor: "bg-bg-sky" },
};

export const SHARED_EVENT_CATEGORY_OPTIONS = (
  Object.entries(SHARED_EVENT_CATEGORY_META) as [
    SharedEventCategory,
    (typeof SHARED_EVENT_CATEGORY_META)[SharedEventCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));
