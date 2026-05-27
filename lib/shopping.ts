import { ShoppingCategory } from "@prisma/client";

export const SHOPPING_CATEGORY_META: Record<
  ShoppingCategory,
  { label: string; emoji: string; chipColor: string }
> = {
  [ShoppingCategory.FRESH]:   { label: "신선식품", emoji: "🥬", chipColor: "bg-bg-mint" },
  [ShoppingCategory.MEAT]:    { label: "정육",     emoji: "🥩", chipColor: "bg-bg-pink" },
  [ShoppingCategory.BAKERY]:  { label: "베이커리", emoji: "🍞", chipColor: "bg-bg-peach" },
  [ShoppingCategory.DAILY]:   { label: "생활용품", emoji: "🧻", chipColor: "bg-bg-lavender" },
  [ShoppingCategory.HYGIENE]: { label: "위생용품", emoji: "🧴", chipColor: "bg-bg-sky" },
  [ShoppingCategory.SNACK]:   { label: "간식",     emoji: "🍫", chipColor: "bg-bg-yellow" },
  [ShoppingCategory.DRINK]:   { label: "음료",     emoji: "🧃", chipColor: "bg-bg-sky" },
  [ShoppingCategory.OTHER]:   { label: "기타",     emoji: "✨", chipColor: "bg-bg-lavender" },
};

export const SHOPPING_CATEGORY_OPTIONS = (
  Object.entries(SHOPPING_CATEGORY_META) as [
    ShoppingCategory,
    (typeof SHOPPING_CATEGORY_META)[ShoppingCategory],
  ][]
).map(([value, meta]) => ({ value, ...meta }));
