import "server-only";

// VAPID config is sourced from env. Generate keys once with:
//   npx web-push generate-vapid-keys
// then add VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT to .env.
// The public key is mirrored to NEXT_PUBLIC_VAPID_PUBLIC_KEY for the browser subscribe flow.

export function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@lifeos.app";

  if (!publicKey || !privateKey) {
    return null;
  }
  return { publicKey, privateKey, subject };
}

export function isPushConfigured() {
  return getVapidConfig() !== null;
}
