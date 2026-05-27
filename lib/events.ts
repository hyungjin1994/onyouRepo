import { EventCategory } from "@prisma/client";

export const EVENT_CATEGORY_META: Record<
  EventCategory,
  { label: string; emoji: string; chipColor: string; dotColor: string }
> = {
  [EventCategory.WORK]: {
    label: "업무",
    emoji: "🏢",
    chipColor: "bg-bg-peach text-foreground",
    dotColor: "bg-peach",
  },
  [EventCategory.PERSONAL]: {
    label: "개인",
    emoji: "👤",
    chipColor: "bg-bg-lavender text-foreground",
    dotColor: "bg-lavender",
  },
  [EventCategory.HEALTH]: {
    label: "건강",
    emoji: "💚",
    chipColor: "bg-bg-mint text-foreground",
    dotColor: "bg-mint",
  },
  [EventCategory.EXERCISE]: {
    label: "운동",
    emoji: "💪",
    chipColor: "bg-bg-mint text-foreground",
    dotColor: "bg-mint",
  },
  [EventCategory.MEDICAL]: {
    label: "의료",
    emoji: "🏥",
    chipColor: "bg-bg-pink text-foreground",
    dotColor: "bg-pink",
  },
  [EventCategory.STUDY]: {
    label: "학습",
    emoji: "🎓",
    chipColor: "bg-bg-sky text-foreground",
    dotColor: "bg-sky",
  },
  [EventCategory.OTHER]: {
    label: "기타",
    emoji: "✨",
    chipColor: "bg-bg-yellow text-foreground",
    dotColor: "bg-yellow",
  },
};

export const EVENT_CATEGORY_OPTIONS = (
  Object.entries(EVENT_CATEGORY_META) as [
    EventCategory,
    (typeof EVENT_CATEGORY_META)[EventCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));
