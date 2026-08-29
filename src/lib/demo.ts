/**
 * Demo-mode flag.
 *
 * The public demo runs the same code against a throwaway database with fake
 * data. AI features are disabled there: the demo URL is public and
 * unauthenticated, so live Claude calls would be an open tab on the owner's
 * API spend.
 *
 * Set NEXT_PUBLIC_DEMO_MODE=true in the demo deployment only.
 *
 * The NEXT_PUBLIC_ prefix is deliberate — the client needs this to explain
 * itself in the UI before the user triggers a doomed request. It's a display
 * flag, not a secret. Enforcement is server-side in assertAIEnabled().
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** Shown in the UI and returned by the API when an AI feature is blocked. */
export const DEMO_AI_MESSAGE =
  "This is the public demo, so the AI features are switched off — they'd call " +
  "the Claude API on the owner's account, and the demo has no login. " +
  "Everything else works: browse the week, tick things off, add to lists. " +
  "The data is fake and resets, so click around freely.";

/** Thrown by assertAIEnabled; carries an HTTP status for the route to use. */
export class DemoModeError extends Error {
  readonly status = 503;
  constructor() {
    super(DEMO_AI_MESSAGE);
    this.name = 'DemoModeError';
  }
}

/**
 * Call at the top of any handler that reaches Claude. Server-side, so it holds
 * regardless of what the client sends.
 */
export function assertAIEnabled(): void {
  if (IS_DEMO) throw new DemoModeError();
}
