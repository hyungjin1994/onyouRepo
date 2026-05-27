import { AssignmentType, ChoreFrequency } from "@prisma/client";

export const CHORE_FREQUENCY_META: Record<
  ChoreFrequency,
  { label: string; description: string }
> = {
  [ChoreFrequency.DAILY]:   { label: "매일", description: "하루도 빠짐없이" },
  [ChoreFrequency.WEEKLY]:  { label: "매주", description: "지정 요일에" },
  [ChoreFrequency.MONTHLY]: { label: "매월", description: "월 1회" },
  [ChoreFrequency.CUSTOM]:  { label: "직접", description: "사용자 지정" },
};

export const ASSIGNMENT_TYPE_META: Record<
  AssignmentType,
  { label: string; description: string; emoji: string }
> = {
  [AssignmentType.ALTERNATE]: { label: "번갈아", description: "하루씩 교대", emoji: "🔄" },
  [AssignmentType.FIXED]:     { label: "고정",   description: "한 사람이",   emoji: "📌" },
  [AssignmentType.BY_DAY]:    { label: "요일별", description: "평일/주말 분담", emoji: "📅" },
  [AssignmentType.ROULETTE]:  { label: "룰렛",   description: "랜덤 배정",   emoji: "🎰" },
};

export const CHORE_PRESETS = [
  { emoji: "🧹", title: "거실 청소", frequency: ChoreFrequency.WEEKLY, daysOfWeek: [0], estimatedTime: 30 },
  { emoji: "🍽", title: "설거지",   frequency: ChoreFrequency.DAILY,  daysOfWeek: [], estimatedTime: 15 },
  { emoji: "🌱", title: "식물 물주기", frequency: ChoreFrequency.WEEKLY, daysOfWeek: [1, 4], estimatedTime: 5 },
  { emoji: "🚮", title: "분리수거",   frequency: ChoreFrequency.WEEKLY, daysOfWeek: [3], estimatedTime: 15 },
  { emoji: "🧺", title: "빨래",       frequency: ChoreFrequency.WEEKLY, daysOfWeek: [0, 3], estimatedTime: 45 },
  { emoji: "🧴", title: "욕실 청소",   frequency: ChoreFrequency.WEEKLY, daysOfWeek: [6], estimatedTime: 30 },
  { emoji: "🛏", title: "침구 정리",   frequency: ChoreFrequency.DAILY,  daysOfWeek: [], estimatedTime: 5 },
  { emoji: "🧹", title: "바닥 청소",   frequency: ChoreFrequency.WEEKLY, daysOfWeek: [2, 5], estimatedTime: 20 },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "일" },
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
];
