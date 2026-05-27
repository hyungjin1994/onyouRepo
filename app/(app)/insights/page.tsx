import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import {
  getActivityHeatmap,
  getDiscoveredPatterns,
  getWeeklyReport,
} from "@/lib/data/insights";
import { cn } from "@/lib/utils";

export const metadata = { title: "인사이트 · LifeOS" };

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const BUCKET_LABELS = ["6시", "9시", "12시", "15시", "18시", "21시"];

export default async function InsightsPage() {
  const [heatmap, report, patterns] = await Promise.all([
    getActivityHeatmap(60),
    getWeeklyReport(),
    getDiscoveredPatterns(),
  ]);

  const peakBucket = (() => {
    if (heatmap.maxValue === 0) return null;
    let peak: { day: number; bucket: number; count: number } | null = null;
    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < 6; b++) {
        if (!peak || heatmap.grid[d][b] > peak.count) {
          peak = { day: d, bucket: b, count: heatmap.grid[d][b] };
        }
      }
    }
    return peak;
  })();

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/profile" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">🧠 인사이트</h1>
      </header>

      {/* Weekly report */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">
          📊 이번 주 ({format(report.weekStart, "M/d", { locale: ko })}–
          {format(report.weekEnd, "M/d", { locale: ko })})
        </h2>
        <Card>
          <ul className="flex flex-col gap-3 text-sm">
            <Row
              emoji="💪"
              label="운동"
              value={`${report.workoutCount}회`}
              hint={report.workoutCount >= 3 ? "목표 달성!" : "조금만 더!"}
            />
            <Row
              emoji="✓"
              label="루틴 완료율"
              value={`${report.routineRate}%`}
              hint={`${report.routineDone}/${report.routineTotal}회`}
            />
            {report.latestWeight !== null && (
              <Row
                emoji="⚖️"
                label="현재 몸무게"
                value={`${report.latestWeight.toFixed(1)}kg`}
                hint={
                  report.weightDelta !== null
                    ? `${report.weightDelta >= 0 ? "+" : ""}${report.weightDelta.toFixed(1)}kg 이번 주`
                    : undefined
                }
              />
            )}
          </ul>
        </Card>
      </section>

      {/* Discovered patterns */}
      {patterns.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground-muted">
            🔍 발견된 패턴
          </h2>
          <Card>
            <ul className="flex flex-col gap-3 text-sm">
              {patterns.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-bg-lavender text-base">
                    {p.emoji}
                  </span>
                  <p className="flex-1 leading-snug">{p.text}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Activity heatmap */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground-muted">
          🗓 활동 히트맵 (최근 60일)
        </h2>
        <Card>
          {heatmap.maxValue === 0 ? (
            <p className="text-center text-xs text-foreground-muted">
              아직 데이터가 충분하지 않아요.
              <br />
              운동과 루틴을 조금씩 쌓아가면 패턴이 보일 거예요.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <Heatmap grid={heatmap.grid} maxValue={heatmap.maxValue} />
              {peakBucket && (
                <p className="text-[11px] text-foreground-muted">
                  💡 가장 활발한 시간:{" "}
                  <span className="font-medium text-foreground">
                    {DAY_LABELS[peakBucket.day]}요일{" "}
                    {BUCKET_LABELS[peakBucket.bucket]}
                  </span>{" "}
                  ({peakBucket.count}회)
                </p>
              )}
            </div>
          )}
        </Card>
      </section>

      <p className="text-center text-[11px] text-foreground-weak">
        AI 패턴 분석은 ANTHROPIC_API_KEY 설정 후 활성화됩니다.
      </p>
    </main>
  );
}

function Heatmap({ grid, maxValue }: { grid: number[][]; maxValue: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[24px_repeat(6,1fr)] gap-1 text-[10px] text-foreground-weak">
        <span />
        {BUCKET_LABELS.map((b) => (
          <span key={b} className="text-center">
            {b}
          </span>
        ))}
      </div>
      {grid.map((row, day) => (
        <div
          key={day}
          className="grid grid-cols-[24px_repeat(6,1fr)] gap-1 items-center"
        >
          <span
            className={cn(
              "text-[10px]",
              day === 0 && "text-pink",
              day === 6 && "text-sky",
              day !== 0 && day !== 6 && "text-foreground-weak",
            )}
          >
            {DAY_LABELS[day]}
          </span>
          {row.map((count, bucket) => (
            <div
              key={bucket}
              className="aspect-square rounded-md"
              style={{ background: intensity(count, maxValue) }}
              title={`${DAY_LABELS[day]} ${BUCKET_LABELS[bucket]}: ${count}회`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function intensity(count: number, max: number) {
  if (count === 0) return "#F4F0FB";
  const ratio = count / max;
  if (ratio < 0.25) return "#E0D5F7";
  if (ratio < 0.5) return "#C4B0EF";
  if (ratio < 0.75) return "#A88BE6";
  return "#8C66DE";
}

function Row({
  emoji,
  label,
  value,
  hint,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-bg-lavender text-base">
        {emoji}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-sm">{label}</span>
        {hint && (
          <span className="text-[11px] text-foreground-muted">{hint}</span>
        )}
      </div>
      <span className="text-lg font-bold">{value}</span>
    </li>
  );
}
