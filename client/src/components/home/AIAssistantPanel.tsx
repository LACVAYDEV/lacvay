import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader2, Bot, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

export function AIAssistantSection() {
  const { aiMessages, aiLoading, sendAI, aiSuggestions } = useApp();
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || aiLoading) return;
    setInput('');
    await sendAI(msg);
  };

  return (
    <Card className="overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/30 p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Left Column: Context & Quick Prompts */}
        <div className="flex flex-col justify-between lg:col-span-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-[17px] font-extrabold text-gray-900">AI Travel Assistant</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Live Chat
              </span>
            </div>

            <p className="mt-2.5 text-[12.5px] leading-relaxed text-gray-600">
              Get instant commute directions, fare estimates, local dining tips, and custom itineraries for your trip around Batangas City.
            </p>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Suggested Questions
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {aiSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-left text-[11.5px] font-medium text-gray-700 shadow-sm transition hover:border-lacvay-green hover:bg-white hover:text-lacvay-green-dark"
                  >
                    <span className="line-clamp-1">{s}</span>
                    <CornerDownLeft className="ml-2 h-3 w-3 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/ai-assistant')}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-lacvay-green transition hover:text-lacvay-green-dark hover:underline"
            >
              Open full screen chat experience
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Chat Window */}
        <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-gray-700">Batangas Travel AI</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ai-assistant')}
              className="text-[10.5px] font-semibold text-gray-500 hover:text-lacvay-green"
            >
              Expand view
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="my-3 max-h-[260px] min-h-[190px] flex-1 space-y-3 overflow-y-auto pr-1 text-[12px]"
          >
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lacvay-green/10 text-lacvay-green mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-sm',
                    msg.role === 'assistant'
                      ? 'rounded-tl-sm bg-gray-50 text-gray-800 border border-gray-100'
                      : 'rounded-tr-sm bg-lacvay-green text-white'
                  )}
                >
                  <MarkdownContent
                    content={msg.content}
                    isUser={msg.role === 'user'}
                    className="text-[12px]"
                  />
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-3.5 py-2.5 text-[11.5px] text-gray-500 w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-lacvay-green" />
                Thinking...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="mt-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-1 pl-3 transition focus-within:border-lacvay-green focus-within:bg-white focus-within:ring-1 focus-within:ring-lacvay-green">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about fares, places, or dining..."
              aria-label="Ask the AI travel assistant"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={aiLoading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lacvay-green text-white transition hover:bg-lacvay-green-dark disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Backwards-compatible alias for existing imports
export const AIAssistantPanel = AIAssistantSection;

export function AIAssistantFab() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/ai-assistant')}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-lacvay-green text-white shadow-lg lg:hidden transition hover:scale-105"
      aria-label="Open AI Travel Assistant"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}
