import { BodyPart, WorkoutType } from "@prisma/client";

import { BODY_PART_META, WORKOUT_TYPE_META } from "@/lib/workout-catalog";

// BMI 분류 (§5.4.1)
export type BmiTier = "UNDER" | "NORMAL" | "OVER" | "OBESE" | "SEVERE";

export function classifyBmi(bmi: number): BmiTier {
  if (bmi < 18.5) return "UNDER";
  if (bmi < 23) return "NORMAL";
  if (bmi < 25) return "OVER";
  if (bmi < 30) return "OBESE";
  return "SEVERE";
}

export function computeBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export const BMI_TIER_META: Record<
  BmiTier,
  { label: string; description: string; accent: string }
> = {
  UNDER:  { label: "저체중",   description: "근력 운동 위주로 시작해보세요",            accent: "bg-bg-sky" },
  NORMAL: { label: "정상",     description: "근력 + 유산소 균형이 좋아요",              accent: "bg-bg-mint" },
  OVER:   { label: "과체중",   description: "유산소 비중을 조금 더 늘려보세요",         accent: "bg-bg-peach" },
  OBESE:  { label: "비만",     description: "저강도 유산소부터 천천히 시작해보세요",   accent: "bg-bg-pink" },
  SEVERE: { label: "고도비만", description: "가벼운 걷기부터, 의사 상담을 권장해요",   accent: "bg-bg-pink" },
};

// Difficulty bands shown to user.
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type Recommendation = {
  id: string;
  type: WorkoutType;
  bodyPart?: BodyPart;
  difficulty: Difficulty;
  title: string;
  reason: string;
  href: string;
  emoji: string;
};

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; emoji: string; accent: string }
> = {
  EASY:   { label: "쉬움", emoji: "🟢", accent: "bg-bg-mint text-foreground" },
  MEDIUM: { label: "보통", emoji: "🟡", accent: "bg-bg-yellow text-foreground" },
  HARD:   { label: "강추", emoji: "🔴", accent: "bg-bg-pink text-foreground" },
};

/**
 * Produce up to 3 ranked recommendations, given:
 *   - tier (BMI band)
 *   - bodyPartCounts: recent gym counts per BodyPart (last 30d)
 *   - workoutsThisWeek: how many workouts logged this week (affects difficulty)
 *
 * Pure function — easy to unit-test, no DB or auth.
 */
export function buildRecommendations(args: {
  tier: BmiTier;
  bodyPartCounts: Record<BodyPart, number>;
  workoutsThisWeek: number;
}): Recommendation[] {
  const { tier, bodyPartCounts, workoutsThisWeek } = args;

  // Difficulty rises with weekly activity. If you've logged 3+ this week we feel
  // safe pushing HARD; if you haven't moved at all, start EASY.
  const baseDifficulty: Difficulty =
    workoutsThisWeek === 0 ? "EASY" : workoutsThisWeek >= 3 ? "HARD" : "MEDIUM";

  // Find the under-trained body part (lowest count over last 30d, with tie-break on creation order).
  const ranked = (Object.keys(bodyPartCounts) as BodyPart[]).sort(
    (a, b) => bodyPartCounts[a] - bodyPartCounts[b],
  );
  const weakest = ranked[0];

  const recs: Recommendation[] = [];

  // Tier-specific main recommendation
  switch (tier) {
    case "UNDER":
    case "NORMAL":
      recs.push(gymRec(weakest, baseDifficulty, bodyPartCounts[weakest]));
      recs.push(
        cardioRec(
          tier === "UNDER" ? "EASY" : "MEDIUM",
          "근력 운동 후 가벼운 유산소로 회복까지 챙겨요",
        ),
      );
      break;
    case "OVER":
      recs.push(cardioRec(baseDifficulty, "유산소 비중을 살짝 늘려볼 시간이에요"));
      recs.push(gymRec(weakest, "MEDIUM", bodyPartCounts[weakest]));
      break;
    case "OBESE":
      recs.push(cardioRec("EASY", "저강도 걷기·사이클로 시작해보세요"));
      recs.push({
        id: "yoga",
        type: WorkoutType.YOGA,
        difficulty: "EASY",
        title: `${WORKOUT_TYPE_META[WorkoutType.YOGA].label} 30분`,
        reason: "관절 부담 없이 코어와 유연성을 챙기는 데 좋아요",
        href: `/workout/new?type=${WorkoutType.YOGA}`,
        emoji: WORKOUT_TYPE_META[WorkoutType.YOGA].emoji,
      });
      break;
    case "SEVERE":
      recs.push({
        id: "walk",
        type: WorkoutType.CARDIO,
        difficulty: "EASY",
        title: "가벼운 걷기 20분",
        reason: "무릎·심장에 부담이 적은 운동부터 시작해요. 의사 상담을 권장해요",
        href: `/workout/new?type=${WorkoutType.CARDIO}`,
        emoji: "🚶",
      });
      recs.push({
        id: "yoga-light",
        type: WorkoutType.YOGA,
        difficulty: "EASY",
        title: "스트레칭 10분",
        reason: "혈류와 관절 가동성을 천천히 끌어올려요",
        href: `/workout/new?type=${WorkoutType.YOGA}`,
        emoji: "🧘",
      });
      break;
  }

  // Always offer one "쉬운" fallback regardless of tier
  if (!recs.some((r) => r.difficulty === "EASY")) {
    recs.push({
      id: "easy-walk",
      type: WorkoutType.CARDIO,
      difficulty: "EASY",
      title: "산책 15분",
      reason: "오늘 컨디션이 별로면 가벼운 산책도 충분해요",
      href: `/workout/new?type=${WorkoutType.CARDIO}`,
      emoji: "🚶",
    });
  }

  return recs.slice(0, 3);
}

function gymRec(part: BodyPart, difficulty: Difficulty, count: number): Recommendation {
  const meta = BODY_PART_META[part];
  return {
    id: `gym-${part}`,
    type: WorkoutType.GYM,
    bodyPart: part,
    difficulty,
    title: `${meta.label} 운동`,
    reason:
      count === 0
        ? "최근 한 달 동안 이 부위는 비어 있었어요"
        : `최근 ${count}회로 다른 부위보다 적어요`,
    href: `/workout/new/gym?part=${part}`,
    emoji: meta.emoji,
  };
}

function cardioRec(difficulty: Difficulty, reason: string): Recommendation {
  return {
    id: "cardio",
    type: WorkoutType.CARDIO,
    difficulty,
    title: `${WORKOUT_TYPE_META[WorkoutType.CARDIO].label} 30분`,
    reason,
    href: `/workout/new?type=${WorkoutType.CARDIO}`,
    emoji: WORKOUT_TYPE_META[WorkoutType.CARDIO].emoji,
  };
}
