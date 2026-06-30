import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql from '@/lib/db';
import { AI_MODEL } from '@/lib/models';
import { financeImportSystemPrompt } from '@/prompts/finance';
import { ParsedTransaction } from '@/lib/types';

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { rawText }: { rawText: string } = await req.json();

    if (!rawText?.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const profileRows = await sql`SELECT monthly_take_home, fixed_expenses FROM finance_profile LIMIT 1`;
    const profile = profileRows[0] ?? { monthly_take_home: 0, fixed_expenses: [] };

    const systemPrompt = financeImportSystemPrompt
      .replace('{{MONTHLY_TAKE_HOME}}', String(profile.monthly_take_home))
      .replace('{{FIXED_EXPENSES}}', JSON.stringify(profile.fixed_expenses));

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: rawText }],
    });

    const rawContent = response.content[0];
    if (rawContent.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response from Claude' }, { status: 500 });
    }

    let text = rawContent.text.trim();
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let transactions: ParsedTransaction[];
    try {
      transactions = JSON.parse(text);
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
    console.error('[POST /api/finance/import]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
