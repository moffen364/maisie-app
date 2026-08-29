import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { AI_MODEL, anthropic, parseClaudeJSON } from '@/lib/models';
import { financeImportSystemPrompt } from '@/prompts/finance';
import { ParsedTransaction } from '@/lib/types';
import { assertAIEnabled, DemoModeError } from '@/lib/demo';

export async function POST(req: Request) {
  try {
    assertAIEnabled();
    const { rawText }: { rawText: string } = await req.json();

    if (!rawText?.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const profileRows = await sql`SELECT monthly_take_home, fixed_expenses FROM finance_profile LIMIT 1`;
    const profile = profileRows[0] ?? { monthly_take_home: 0, fixed_expenses: [] };

    const systemPrompt = financeImportSystemPrompt
      .replace('{{MONTHLY_TAKE_HOME}}', String(profile.monthly_take_home))
      .replace('{{FIXED_EXPENSES}}', JSON.stringify(profile.fixed_expenses));

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: rawText }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let transactions: ParsedTransaction[];
    try {
      transactions = parseClaudeJSON<ParsedTransaction[]>(rawContent.text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse Claude response' }, { status: 500 });
    }

    // Uncertain ones first
    transactions.sort((a, b) => {
      if (a.confirmed === b.confirmed) return 0;
      return a.confirmed ? 1 : -1;
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    if (error instanceof DemoModeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[POST /api/finance/import]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
