import Anthropic from '@anthropic-ai/sdk';

export const AI_MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';
export const AI_MODEL_SMART = process.env.CLAUDE_MODEL_SMART ?? 'claude-sonnet-4-6';

export const anthropic = new Anthropic();

export function parseClaudeJSON<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned) as T;
}
