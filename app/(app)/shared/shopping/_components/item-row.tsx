"use client";

import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { deleteShoppingItem, togglePurchased } from "../actions";

export function ItemRow({
  id,
  name,
  quantity,
  note,
  purchased,
}: {
  id: string;
  name: string;
  quantity?: string | null;
  note?: string | null;
  purchased: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-card bg-surface px-4 py-2.5 shadow-card transition-opacity",
        purchased && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => startTransition(() => togglePurchased(id))}
        disabled={pending}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition-all",
          purchased
            ? "border-mint bg-mint text-white"
            : "border-border bg-surface hover:border-lavender",
        )}
      >
        {purchased ? "✓" : ""}
      </button>
      <div className="flex flex-1 flex-col">
        <span
          className={cn(
            "text-sm",
            purchased && "text-foreground-muted line-through",
          )}
        >
          {name}
          {quantity ? ` · ${quantity}` : ""}
        </span>
        {note && (
          <span className="text-[10px] text-foreground-weak">{note}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => startTransition(() => deleteShoppingItem(id))}
        disabled={pending}
        className="text-[11px] text-foreground-weak hover:text-pink disabled:opacity-50"
      >
        삭제
      </button>
    </li>
  );
}
