import { BodyPart, WorkoutType } from "@prisma/client";

export const WORKOUT_TYPE_META: Record<
  WorkoutType,
  { label: string; emoji: string; description: string }
> = {
  [WorkoutType.GYM]: {
    label: "헬스",
    emoji: "💪",
    description: "부위별 근력 운동",
  },
  [WorkoutType.CARDIO]: {
    label: "유산소",
    emoji: "🏃",
    description: "러닝 · 사이클 · 등산",
  },
  [WorkoutType.YOGA]: {
    label: "요가/필라테스",
    emoji: "🧘",
    description: "유연성 · 코어",
  },
  [WorkoutType.SWIMMING]: {
    label: "수영",
    emoji: "🏊",
    description: "자유형 · 평영 · 접영",
  },
  [WorkoutType.BALL]: {
    label: "구기운동",
    emoji: "⚽",
    description: "축구 · 농구 · 테니스",
  },
  [WorkoutType.OTHER]: {
    label: "기타",
    emoji: "✨",
    description: "직접 입력",
  },
};

export const WORKOUT_TYPE_OPTIONS = (
  Object.entries(WORKOUT_TYPE_META) as [
    WorkoutType,
    (typeof WORKOUT_TYPE_META)[WorkoutType],
  ][]
).map(([value, meta]) => ({ value, ...meta }));

export const BODY_PART_META: Record<
  BodyPart,
  { label: string; emoji: string; chipColor: string }
> = {
  [BodyPart.CHEST]:     { label: "가슴", emoji: "🫀", chipColor: "bg-bg-pink" },
  [BodyPart.BACK]:      { label: "등",   emoji: "🦴", chipColor: "bg-bg-sky" },
  [BodyPart.LEGS]:      { label: "하체", emoji: "🦵", chipColor: "bg-bg-mint" },
  [BodyPart.SHOULDERS]: { label: "어깨", emoji: "💪", chipColor: "bg-bg-peach" },
  [BodyPart.ARMS]:      { label: "팔",   emoji: "💪", chipColor: "bg-bg-lavender" },
  [BodyPart.ABS]:       { label: "복근", emoji: "🔥", chipColor: "bg-bg-yellow" },
};

export const BODY_PART_OPTIONS = (
  Object.entries(BODY_PART_META) as [
    BodyPart,
    (typeof BODY_PART_META)[BodyPart],
  ][]
).map(([value, meta]) => ({ value, ...meta }));

/**
 * Built-in exercise catalog per body part (§5.3.2). Users can also enter custom names
 * via the "직접 입력" entry.
 */
export const EXERCISES_BY_PART: Record<BodyPart, string[]> = {
  [BodyPart.CHEST]: [
    "벤치프레스",
    "인클라인 벤치프레스",
    "디클라인 벤치프레스",
    "덤벨 벤치프레스",
    "덤벨 플라이",
    "체스트 프레스 머신",
    "케이블 크로스오버",
    "푸쉬업",
    "딥스",
    "펙덱 플라이",
    "스미스 머신 벤치프레스",
    "덤벨 풀오버",
  ],
  [BodyPart.BACK]: [
    "데드리프트",
    "풀업",
    "랫풀다운",
    "바벨 로우",
    "덤벨 로우",
    "시티드 로우",
    "티바 로우",
    "친업",
    "백 익스텐션",
    "슈러그",
  ],
  [BodyPart.LEGS]: [
    "스쿼트",
    "프론트 스쿼트",
    "레그프레스",
    "런지",
    "불가리안 스플릿 스쿼트",
    "루마니안 데드리프트",
    "레그 익스텐션",
    "레그 컬",
    "카프 레이즈",
    "힙 쓰러스트",
    "글루트 브릿지",
    "고블릿 스쿼트",
    "스텝업",
    "월 시트",
  ],
  [BodyPart.SHOULDERS]: [
    "숄더프레스",
    "오버헤드 프레스",
    "사이드 레터럴 레이즈",
    "프론트 레이즈",
    "리어 델트 플라이",
    "업라이트 로우",
    "아놀드 프레스",
    "페이스 풀",
  ],
  [BodyPart.ARMS]: [
    "바벨 컬",
    "덤벨 컬",
    "해머 컬",
    "프리처 컬",
    "트라이셉스 익스텐션",
    "트라이셉스 푸쉬다운",
    "오버헤드 트라이셉스",
    "스컬크러셔",
    "딥스 (트라이셉스)",
    "케이블 컬",
    "콘센트레이션 컬",
  ],
  [BodyPart.ABS]: [
    "크런치",
    "플랭크",
    "사이드 플랭크",
    "레그레이즈",
    "행잉 레그레이즈",
    "러시안 트위스트",
    "마운틴 클라이머",
    "바이시클 크런치",
    "케이블 크런치",
  ],
};
