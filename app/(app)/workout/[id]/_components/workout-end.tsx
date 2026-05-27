"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { discardWorkout, finishWorkout } from "../../actions";

export function WorkoutEndControls({ workoutId }: { workoutId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={() => startTransition(() => finishWorkout(workoutId))}
      >
        {pending ? "저장 중..." : "운동 끝내기"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm("기록을 저장하지 않고 종료할까요?")) return;
          startTransition(() => discardWorkout(workoutId));
        }}
        className="text-pink hover:bg-bg-pink"
      >
        기록 버리기
      </Button>
    </div>
  );
}
