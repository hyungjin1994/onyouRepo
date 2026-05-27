"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SHOPPING_CATEGORY_OPTIONS } from "@/lib/shopping";
import { cn } from "@/lib/utils";
import { addShoppingItem } from "../actions";

export function AddItemForm() {
  const [state, action, pending] = useActionState(addShoppingItem, undefined);
  const [category, setCategory] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.message && !Object.keys(state.errors ?? {}).length) {
      formRef.current?.reset();
      setCategory("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input name="name" placeholder="살 것" required className="flex-1" />
        <Input name="quantity" placeholder="수량" className="w-24" />
      </div>
      {state?.errors?.name?.[0] && (
        <p className="text-xs text-pink">{state.errors.name[0]}</p>
      )}

      <input type="hidden" name="category" value={category} />
      <div className="flex flex-wrap gap-1.5">
        {SHOPPING_CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              setCategory((c) => (c === opt.value ? "" : opt.value))
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] transition-colors",
              opt.chipColor,
              category === opt.value && "ring-2 ring-lavender",
            )}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>

      <Button type="submit" size="md" disabled={pending}>
        {pending ? "추가 중..." : "+ 추가"}
      </Button>
    </form>
  );
}
