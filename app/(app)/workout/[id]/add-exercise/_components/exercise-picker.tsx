"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BodyPart } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addExercise } from "../../../actions";

export function ExercisePicker({
  workoutId,
  bodyPart,
  catalog,
}: {
  workoutId: string;
  bodyPart: BodyPart | null;
  catalog: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState("");

  const pick = (name: string) => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addExercise(workoutId, name.trim(), bodyPart);
      router.push(`/workout/${workoutId}`);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {catalog.length > 0 && (
        <ul className="flex flex-col gap-2">
          {catalog.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => pick(name)}
                disabled={pending}
                className="flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-card hover:bg-bg-lavender/30 disabled:opacity-60"
              >
                <span className="text-sm">{name}</span>
                <span className="text-foreground-weak">+</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 rounded-2xl bg-bg-lavender/40 p-4">
        <p className="text-xs text-foreground-muted">직접 입력</p>
        <div className="flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="종목 이름"
            className="flex-1"
          />
          <Button
            type="button"
            size="md"
            disabled={pending || !custom.trim()}
            onClick={() => pick(custom)}
          >
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
