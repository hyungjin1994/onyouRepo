import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { getWeightLogs, type WeightRange } from "@/lib/data/weight";
import { WeightChart } from "./_components/weight-chart";
import { AddWeightForm } from "./_components/add-weight-form";

export const metadata = { title: "몸무게 · LifeOS" };

const RANGE_LABELS: Record<WeightRange, string> = {
  "1w": "1주",
  "1m": "1개월",
  "3m": "3개월",
  "1y": "1년",
  all: "전체",
};

type SearchParams = Promise<{ range?: string }>;

export default async function WeightPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { range: rawRange } = await searchParams;
  const range: WeightRange =
    rawRange && rawRange in RANGE_LABELS ? (rawRange as WeightRange) : "3m";

  const logs = await getWeightLogs(range);

  const stats = (() => {
    if (logs.length === 0) return null;
    const weights = logs.map((l) => l.weight);
    return {
      latest: weights[weights.length - 1],
      avg: weights.reduce((a, b) => a + b, 0) / weights.length,
      min: Math.min(...weights),
      max: Math.max(...weights),
      delta: weights[weights.length - 1] - weights[0],
    };
  })();

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <main className="flex flex-col gap-6 px-6 pt-10 pb-12">
      <header className="flex items-center gap-3">
        <Link href="/profile" className="text-foreground-muted">
          ‹
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">⚖️ 몸무게 변화</h1>
      </header>

      <div className="flex gap-1.5">
        {(Object.keys(RANGE_LABELS) as WeightRange[]).map((r) => (
          <Link
            key={r}
            href={`/profile/weight?range=${r}`}
            className={
              r === range
                ? "rounded-full bg-lavender px-3 py-1 text-xs text-white"
                : "rounded-full bg-bg-lavender px-3 py-1 text-xs text-foreground-muted hover:brightness-95"
            }
          >
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <Card className="text-center text-sm text-foreground-muted">
          아직 기록이 없어요.
          <br />
          아래에서 첫 기록을 남겨보세요.
        </Card>
      ) : (
        <>
          <Card>
            <WeightChart
              data={logs.map((l) => ({
                date: format(l.date, "M/d"),
                weight: l.weight,
              }))}
            />
          </Card>

          {stats && (
            <section className="grid grid-cols-4 gap-2 text-center text-xs">
              <Tile label="현재" value={`${stats.latest.toFixed(1)}kg`} />
              <Tile label="평균" value={`${stats.avg.toFixed(1)}kg`} />
              <Tile label="최저" value={`${stats.min.toFixed(1)}kg`} />
              <Tile
                label="변화"
                value={`${stats.delta >= 0 ? "+" : ""}${stats.delta.toFixed(1)}kg`}
                accent={stats.delta > 0 ? "text-peach" : "text-mint"}
              />
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">기록 추가</h2>
        <Card>
          <AddWeightForm defaultDate={today} />
        </Card>
      </section>

      {logs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">최근 기록</h2>
          <ul className="flex flex-col gap-1">
            {[...logs].reverse().slice(0, 10).map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-sm shadow-card"
              >
                <span className="text-foreground-muted">
                  {format(l.date, "M월 d일 (E)", { locale: ko })}
                </span>
                <span className="font-medium">{l.weight.toFixed(1)}kg</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-bg-lavender py-3">
      <span className="text-foreground-weak">{label}</span>
      <span className={`text-sm font-bold ${accent ?? ""}`}>{value}</span>
    </div>
  );
}
