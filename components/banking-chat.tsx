'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Landmark, Send, ShieldCheck, User } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const SUGGESTIONS = [
  'How do I request an IBAN letter?',
  'What are chargeback dispute windows?',
  'International wire cut-off times?',
  'KYC renewal requirements?',
];

export function BankingChat() {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isGenerating = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput('');
    await sendMessage({ text });
  }

  async function handleSuggestion(text: string) {
    if (isGenerating) return;
    await sendMessage({ text });
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-4 text-slate-100">
      <Card className="flex h-full max-h-[900px] w-full max-w-3xl flex-col border-slate-800 bg-slate-900 text-slate-100 ring-slate-800">
        <CardHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Landmark className="size-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-100">
                  Enterprise Banking Compliance Assistant
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Policy-grounded answers from official banking guidelines
                </p>
              </div>
            </div>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-3" />
              Compliance Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-0">
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Bot className="size-10 text-slate-600" />
                  <p className="max-w-sm text-sm text-slate-400">
                    Ask about account policies, card procedures, international transfers, or
                    compliance requirements. All answers cite official policy IDs.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === 'user'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="size-4" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-blue-600/20 text-slate-100'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type !== 'text') return null;
                      return (
                        <span key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isGenerating && messages.at(-1)?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Bot className="size-4" />
                  </div>
                  <div className="rounded-xl bg-slate-800 px-4 py-3">
                    <span className="inline-flex gap-1">
                      <span className="size-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                disabled={isGenerating}
                className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </CardContent>

        <CardFooter className="border-t border-slate-800 p-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about banking policies..."
              disabled={isGenerating}
              className="flex-1 border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
