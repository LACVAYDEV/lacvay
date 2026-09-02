import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function AIAssistantPanel() {
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
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-lacvay-green" />
        <h3 className="text-[15px] font-bold text-gray-900">AI Travel Assistant</h3>
        <Sparkles className="h-3 w-3 text-lacvay-lime" />
      </div>

      <div ref={scrollRef} className="mt-4 max-h-[220px] flex-1 space-y-2.5 overflow-y-auto pr-1">
        {aiMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed',
              msg.role === 'assistant'
                ? 'rounded-tl-md bg-gradient-to-br from-lacvay-lime/20 to-lacvay-green/5 text-gray-700'
                : 'ml-6 rounded-tr-md bg-lacvay-green text-white',
            )}
          >
            {msg.content.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className={cn(i > 0 && 'mt-1', i === 0 && msg.role === 'assistant' && 'font-bold text-lacvay-green-dark')}>
                {line}
              </p>
            ))}
          </div>
        ))}
        {aiLoading && (
          <div className="flex items-center gap-2 px-1 text-[11.5px] text-gray-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {aiSuggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSend(s)}
            className="block w-full rounded-full border border-lacvay-green/25 bg-white px-3.5 py-2 text-left text-[11.5px] font-medium text-gray-600 transition hover:border-lacvay-green hover:text-lacvay-green-dark"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-4 pr-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          aria-label="Ask the AI travel assistant"
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={aiLoading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-white transition hover:bg-lacvay-green-dark disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/ai-assistant')}
        className="mt-3 self-start text-[11px] font-semibold text-lacvay-green hover:underline"
      >
        Open full assistant →
      </button>
    </Card>
  );
}

export function AIAssistantFab() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/ai-assistant')}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-lacvay-green to-lacvay-lime text-white shadow-lg xl:hidden"
      aria-label="Open AI Travel Assistant"
    >
      <Sparkles className="h-6 w-6" />
    </button>
  );
}
