import Anthropic from '@anthropic-ai/sdk';
import { IS_DEMO, DemoModeError } from './demo';

export const AI_MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';
export const AI_MODEL_SMART = process.env.CLAUDE_MODEL_SMART ?? 'claude-sonnet-4-6';

/**
 * In demo mode the client itself refuses, so a route that forgets
 * assertAIEnabled() still cannot spend the owner's API credits. Defence in
 * depth: the guard in each route gives a clean error, this catches mistakes.
 */
export const anthropic = IS_DEMO
  ? (new Proxy({} as Anthropic, {
      get() {
        throw new DemoModeError();
      },
    }) as Anthropic)
  : new Anthropic();

export function parseClaudeJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned) as T;
}
