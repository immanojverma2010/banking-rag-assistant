'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Landmark, Send, User } from 'lucide-react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';

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

type MessageBubbleProps = {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    parts: Array<{ type?: string; text?: string }>;
  };
  isGenerating: boolean;
  isLatestAssistantMessage: boolean;
};

const MessageBubble = memo(function MessageBubble({
  message,
  isGenerating,
  isLatestAssistantMessage,
}: MessageBubbleProps) {
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  const shouldAnimate =
    message.role === 'assistant' && isGenerating && isLatestAssistantMessage && message.parts.some(part => part.type === 'text');

  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`message-avatar ${message.role === 'user' ? 'message-avatar-user' : 'message-avatar-assistant'}`}
      >
        {message.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={`message-bubble ${message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'}`}
      >
        {message.parts.map((part, index) => {
         if (part.type !== 'text') return null;

         const rawText = part.text ?? '';
         const tokens = rawText.split(/(\s+)/);

         if (!shouldAnimate || tokens.every(token => token.trim() === '')) {
           return (
             <span key={`${message.id}-${index}`} className="whitespace-pre-wrap">
               {part.text}
             </span>
           );
         }

         let wordIndex = 0;

         return (
           <span key={`${message.id}-${index}`} className="whitespace-pre-wrap">
             {tokens.map((token, tokenIndex) => {
               if (token.trim() === '') {
                 return <span key={`${message.id}-${index}-${tokenIndex}`}>{token}</span>;
               }

               const style = { ['--i' as string]: String(wordIndex) } as CSSProperties;
               wordIndex += 1;

               return (
                 <span key={`${message.id}-${index}-${tokenIndex}`} className="word-stream" style={style}>
                   {token}
                 </span>
               );
             })}
           </span>
         );
        })}
      </div>
    </div>
  );
});

type SuggestionPillProps = {
  suggestion: string;
  onClick: (value: string) => void;
  disabled: boolean;
};

const SuggestionPill = memo(function SuggestionPill({
  suggestion,
  onClick,
  disabled,
}: SuggestionPillProps) {
  return (
    <button
      key={suggestion}
      type="button"
      onClick={() => onClick(suggestion)}
      disabled={disabled}
      className="chat-suggestion-pill"
    >
      {suggestion}
    </button>
  );
});

export function BankingChat() {
  const [input, setInput] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isGenerating = useMemo(
    () => status === 'submitted' || status === 'streaming',
    [status],
  );

  const streamState = useMemo(() => {
    if (status === 'submitted') return 'Sending';
    if (status === 'streaming') return 'Streaming';
    if (status === 'error') return 'Error';
    if (messages.length > 0) return 'Ready';
    return 'Idle';
  }, [messages.length, status]);

  const latestAssistantMessageId = useMemo(() => {
    const lastMessage = messages.at(-1);
    return lastMessage && lastMessage.role === 'assistant' ? lastMessage.id : null;
  }, [messages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, status]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = input.trim();
      if (!text || isGenerating) return;
      setInput('');
      await sendMessage({ text });
    },
    [input, isGenerating, sendMessage],
  );

  const handleSuggestion = useCallback(
    async (text: string) => {
      if (isGenerating) return;
      await sendMessage({ text });
    },
    [isGenerating, sendMessage],
  );

  const suggestions = useMemo(() => SUGGESTIONS, []);

  return (
    <div className="banking-chat-shell">
      <Card className="banking-chat-card">
        <CardHeader className="banking-chat-header">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="banking-chat-brand-icon">
                <Landmark className="size-4" />
              </div>
              <div>
                <CardTitle className="banking-chat-title">
                  Enterprise Banking Compliance Assistant
                </CardTitle>
                <p className="banking-chat-subtitle">
                  Policy-grounded answers from official banking guidelines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="banking-chat-status-badge">
                <span className="banking-chat-status-dot" />
                {streamState}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="banking-chat-content">
          <ScrollArea viewportRef={viewportRef} className="px-4 py-4">
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
                <MessageBubble
                  key={message.id}
                  message={message}
                  isGenerating={isGenerating}
                  isLatestAssistantMessage={message.id === latestAssistantMessageId}
                />
              ))}

              {isGenerating && messages.at(-1)?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="message-avatar message-avatar-assistant">
                    <Bot className="size-4" />
                  </div>
                  <div className="chat-typing-indicator">
                    <span className="inline-flex gap-1">
                      <span className="chat-typing-dot chat-typing-dot-1" />
                      <span className="chat-typing-dot chat-typing-dot-2" />
                      <span className="chat-typing-dot chat-typing-dot-3" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="banking-chat-suggestions">
            {suggestions.map((suggestion) => (
              <SuggestionPill
                key={suggestion}
                suggestion={suggestion}
                onClick={handleSuggestion}
                disabled={isGenerating}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="banking-chat-footer">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about banking policies..."
              disabled={isGenerating}
              className="banking-chat-input"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="banking-chat-send-button"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
