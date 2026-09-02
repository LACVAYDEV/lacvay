import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';

export default function AIAssistantPage() {
  const { aiMessages, aiLoading, sendAI, aiSuggestions } = useApp();
  const [input, setInput] = useState('');

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || aiLoading) return;
    setInput('');
    await sendAI(msg);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Sparkles className="h-6 w-6 text-lacvay-green" />
          AI Travel Assistant
        </h2>
        <p className="text-sm text-gray-500">Your friendly Batangas City travel buddy</p>
      </div>

      <Card className="flex min-h-[480px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'assistant'
                  ? 'bg-gray-50 text-gray-700'
                  : 'ml-auto bg-lacvay-green text-white'
              }`}
            >
              {msg.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> LACVAY AI is thinking...
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {aiSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-lacvay-green"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-lacvay-green"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={aiLoading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-lacvay-green text-white disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  );
}
