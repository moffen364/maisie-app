'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlanSection } from '@/lib/types';

interface ChatPanelProps {
  section: PlanSection;
  currentInput: string;
  userProfile: string;
  onAddSuggestion?: (text: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function looksLikeList(text: string): boolean {
  return /(\n[-•*]|\n\d+\.|\n-\s)/.test(text) || text.split('\n').length > 2;
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]*\*\*)/g);
    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') && part.length > 4
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
      </span>
    );
  });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400"
          style={{
            animation: 'typingPulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingPulse {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function ChatPanel({
  section,
  currentInput,
  onAddSuggestion,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasOpened = useRef(false);

  // Fetch profile on mount
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setUserProfile(data?.content ?? ''))
      .catch(() => {});
  }, []);

  // Send opening message on first open
  useEffect(() => {
    if (hasOpened.current) return;
    hasOpened.current = true;

    const openingMessages: Message[] = [
      {
        role: 'user',
        content: '__open__',
      },
    ];

    sendMessages(openingMessages, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessages(msgs: Message[], isOpening = false) {
    setLoading(true);

    const messagesForApi = isOpening ? [] : msgs;

    try {
      const response = await fetch('/api/plan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          messages: messagesForApi,
          currentInput,
          userProfile,
          opening: isOpening,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      // Add placeholder assistant message
      setMessages((prev) => {
        const filtered = isOpening ? [] : prev;
        return [...filtered, { role: 'assistant', content: '' }];
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: text };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const filtered = isOpening ? [] : prev;
        return [
          ...filtered,
          {
            role: 'assistant',
            content: "Sorry, I couldn't connect right now. Try again in a moment.",
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    await sendMessages(newMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="mt-3 bg-brand-faint rounded-2xl border border-pink-100 p-3">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto flex flex-col gap-2 mb-3"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] text-sm px-3 py-2 rounded-xl leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand text-white'
                  : 'bg-white border border-pink-100 text-gray-800'
              }`}
            >
              {msg.content
                ? (msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content)
                : (loading && i === messages.length - 1 ? '' : ' ')}
            </div>

            {/* Add to notes button for assistant messages with lists */}
            {msg.role === 'assistant' &&
              msg.content &&
              looksLikeList(msg.content) &&
              onAddSuggestion &&
              !loading && (
                <button
                  type="button"
                  onClick={() => onAddSuggestion(msg.content)}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 1v6M2 5l3-3 3 3"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add to notes ↑
                </button>
              )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-100 rounded-xl">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Initial loading state (before first message placeholder) */}
        {loading && messages.length === 0 && (
          <div className="flex items-start">
            <div className="bg-white border border-gray-100 rounded-xl">
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          className="flex-1 h-9 text-sm border border-pink-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand bg-white placeholder-gray-400"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="h-9 w-9 rounded-xl bg-brand text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-dark transition-colors flex-shrink-0"
          aria-label="Send"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 7h12M7 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
