import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserProfile } from '@/lib/db';
import { exercisePrompt } from '@/prompts/exercise';
import { mealsPrompt } from '@/prompts/meals';
import { todosPrompt } from '@/prompts/todos';
import { socialPrompt } from '@/prompts/social';
import { eventsPrompt } from '@/prompts/events';

const client = new Anthropic();

const sectionPrompts: Record<string, string> = {
  exercise: exercisePrompt,
  meals: mealsPrompt,
  todos: todosPrompt,
  social: socialPrompt,
  events: eventsPrompt,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, messages, currentInput, userProfile } = body;

    if (!section) {
      return Response.json({ error: 'section is required' }, { status: 400 });
    }

    const sectionPromptText = sectionPrompts[section];
    if (!sectionPromptText) {
      return Response.json({ error: `Unknown section: ${section}` }, { status: 400 });
    }

    const profile = userProfile ?? (await getUserProfile());

    const systemPrompt = `${sectionPromptText}

User profile:
${profile || 'No profile yet.'}

User's current notes for this section:
${currentInput || 'Nothing entered yet.'}`;

    let chatMessages: { role: 'user' | 'assistant'; content: string }[] = Array.isArray(messages)
      ? messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      : [];

    if (chatMessages.length === 0) {
      chatMessages = [{ role: 'user', content: `I'm planning my ${section} for the week.` }];
    }

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: chatMessages,
      stream: true,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        },
      }),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  } catch (error) {
    console.error('[POST /api/plan/chat]', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
