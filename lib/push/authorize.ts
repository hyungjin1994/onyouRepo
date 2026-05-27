import "server-only";

/**
 * Authorize a cron-triggered request.
 *
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. We accept that, and also
 * accept Vercel's internal `x-vercel-cron` header for safety.
 * Returns true if the request is authorized.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In dev we allow cron endpoints to run without auth so they can be smoke-tested.
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  // Fallback: Vercel infra header (present on platform-triggered crons).
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return false;
}
