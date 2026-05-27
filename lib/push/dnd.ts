// Do-not-disturb check. DND windows are stored as "HH:mm" in the user's timezone.
// A window like 23:00 → 07:00 wraps midnight; 14:00 → 16:00 does not.

function hhmmToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function nowMinutesInTz(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function isWithinDnd(
  now: Date,
  start: string,
  end: string,
  timezone = "Asia/Seoul",
): boolean {
  const startMin = hhmmToMinutes(start);
  const endMin = hhmmToMinutes(end);
  if (startMin === null || endMin === null) return false;
  if (startMin === endMin) return false;

  const nowMin = nowMinutesInTz(now, timezone);

  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}
