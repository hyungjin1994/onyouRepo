export function FairnessBar({
  ownerLabel,
  partnerLabel,
  ownerPct,
  partnerPct,
  ownerCount,
  partnerCount,
}: {
  ownerLabel: string;
  partnerLabel: string;
  ownerPct: number;
  partnerPct: number;
  ownerCount: number;
  partnerCount: number;
}) {
  const hasData = ownerCount + partnerCount > 0;
  return (
    <div className="mt-2 flex flex-col gap-1">
      {!hasData && (
        <p className="text-[11px] text-foreground-weak">아직 기록이 없어요</p>
      )}
      <div className="flex items-center gap-2 text-xs">
        <span className="w-8 shrink-0 text-right">{ownerLabel}</span>
        <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-bg-lavender/60">
          <div className="bg-lavender" style={{ width: `${ownerPct}%` }} />
          <div className="bg-mint" style={{ width: `${partnerPct}%` }} />
        </div>
        <span className="w-8 shrink-0">{partnerLabel}</span>
      </div>
      <div className="flex justify-between text-[10px] text-foreground-weak">
        <span>{ownerCount}회 ({ownerPct}%)</span>
        <span>{partnerCount}회 ({partnerPct}%)</span>
      </div>
    </div>
  );
}
