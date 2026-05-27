import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import {
  BodyPart,
  EventCategory,
  WorkoutType,
} from "@prisma/client";

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "log_workout",
    description:
      "운동 기록을 저장합니다. 사용자가 운동 종목/세트/무게/횟수를 명확하게 말한 경우 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: Object.values(WorkoutType),
          description: "운동 종류 — GYM(헬스), CARDIO(유산소), YOGA, SWIMMING, BALL(구기), OTHER",
        },
        body_part: {
          type: "string",
          enum: Object.values(BodyPart),
          description: "헬스의 경우 운동 부위 — CHEST/BACK/LEGS/SHOULDERS/ARMS/ABS",
        },
        exercises: {
          type: "array",
          description: "운동 종목 목록. 각 종목은 이름과 세트 배열.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "종목 이름 (예: 벤치프레스, 스쿼트)" },
              sets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    weight: { type: "number", description: "무게(kg). 맨몸 운동이면 생략." },
                    reps: { type: "number", description: "반복 횟수" },
                  },
                  required: ["reps"],
                },
              },
            },
            required: ["name", "sets"],
          },
        },
        notes: { type: "string", description: "메모 (선택)" },
      },
      required: ["type", "exercises"],
    },
  },
  {
    name: "mark_routine_done",
    description:
      "오늘 루틴을 완료 처리합니다. 사용자가 등록한 루틴 중에서 가장 가까운 것을 찾아 routine_title로 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        routine_title: {
          type: "string",
          description: "루틴의 정확한 또는 가까운 제목 (예: '비타민 D', '아침 스트레칭')",
        },
      },
      required: ["routine_title"],
    },
  },
  {
    name: "log_weight",
    description: "몸무게를 기록합니다. 숫자가 명확할 때만 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        weight: { type: "number", description: "몸무게(kg)" },
        body_fat: { type: "number", description: "체지방률(%) — 선택" },
        muscle_mass: { type: "number", description: "근육량(kg) — 선택" },
        note: { type: "string", description: "메모 — 선택" },
      },
      required: ["weight"],
    },
  },
  {
    name: "create_event",
    description: "캘린더에 일정을 추가합니다. 날짜와 시간이 명확할 때만 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "일정 제목" },
        date: { type: "string", description: "YYYY-MM-DD 형식의 날짜" },
        start_time: { type: "string", description: "HH:MM 형식의 시작 시간" },
        end_time: { type: "string", description: "HH:MM 형식의 종료 시간" },
        is_all_day: { type: "boolean", description: "하루 종일 여부" },
        category: {
          type: "string",
          enum: Object.values(EventCategory),
          description: "일정 카테고리",
        },
      },
      required: ["title", "date", "category"],
    },
  },
];

export type LogWorkoutInput = {
  type: WorkoutType;
  body_part?: BodyPart;
  exercises: Array<{
    name: string;
    sets: Array<{ weight?: number; reps: number }>;
  }>;
  notes?: string;
};

export type MarkRoutineDoneInput = { routine_title: string };
export type LogWeightInput = {
  weight: number;
  body_fat?: number;
  muscle_mass?: number;
  note?: string;
};
export type CreateEventInput = {
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  category: EventCategory;
};
