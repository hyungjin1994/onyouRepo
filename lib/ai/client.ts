import "server-only";

import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ?? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

// Cheapest model — switch to "claude-sonnet-4-6" or "claude-opus-4-7" for higher quality.
export const AI_MODEL = "claude-haiku-4-5";

export const isAIConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
