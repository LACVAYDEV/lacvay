import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Loader2,
  Bookmark,
  Check,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { savedGuidesService } from '@/services/savedGuidesService';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { cn } from '@/lib/utils';
import type { AIMessage, SavedGuideStep } from '@/types';

function parseGuideFromMessage(content: string): {
  title: string;
  summary: string;
  steps: SavedGuideStep[];
} {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Try to find a heading
  let title = 'Batangas City Trip Itinerary';
  for (const line of lines) {
    const clean = line.replace(/^[#* \t-]+/, '').replace(/[*#]/g, '').trim();
    if (
      clean.length > 5 &&
      clean.length < 65 &&
      !clean.toLowerCase().startsWith('here') &&
      !clean.toLowerCase().startsWith('magandang')
    ) {
      title = clean;
      break;
    }
  }

  // Summary: first narrative paragraph
  let summary = '';
  for (const line of lines) {
    if (
      !line.startsWith('#') &&
      !line.startsWith('*') &&
      !line.match(/^\d+[.)]/) &&
      line.length > 20
    ) {
      summary = line.slice(0, 180);
      break;
    }
  }

  // Parse numbered steps or bullet points
  const steps: SavedGuideStep[] = [];
  let order = 1;
  for (const line of lines) {
    const numMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    const bulletMatch = line.match(/^[*•-]\s+\*\*(.+?)\*\*:?\s*(.*)/);

    if (numMatch) {
      const stepText = numMatch[2].replace(/[*_]/g, '').trim();
      const parts = stepText.split(/[:-]\s+/);
      steps.push({
        order: order++,
        title: parts[0]?.trim() || `Stop ${order}`,
        description: parts[1]?.trim() || parts[0]?.trim(),
      });
    } else if (bulletMatch) {
      steps.push({
        order: order++,
        title: bulletMatch[1].trim(),
        description: bulletMatch[2].trim() || bulletMatch[1].trim(),
      });
    }
  }

  if (steps.length === 0) {
    steps.push({
      order: 1,
      title: title,
      description: summary || 'Recommended stops and transit options across Batangas City',
    });
  }

  return {
    title,
    summary: summary || content.slice(0, 150) + '...',
    steps,
  };
}

export default function AIAssistantPage() {
  const {
    aiMessages,
    aiLoading,
    sendAI,
    clearAIMessages,
    aiSuggestions,
    showToast,
  } = useApp();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [savingGuideId, setSavingGuideId] = useState<string | null>(null);
  const [savedGuideIds, setSavedGuideIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when new messages appear or while loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || aiLoading) return;
    setInput('');
    await sendAI(msg);
    inputRef.current?.focus();
  };

  const handleSaveGuide = async (msg: AIMessage) => {
    if (!user) {
      showToast('Please sign in to save guides to your trips.');
      navigate('/login');
      return;
    }

    setSavingGuideId(msg.id);
    try {
      const parsed = parseGuideFromMessage(msg.content);
      await savedGuidesService.saveGuide(user.id, {
        title: parsed.title,
        summary: parsed.summary,
        steps: parsed.steps,
      });

      setSavedGuideIds((prev) => new Set([...prev, msg.id]));
      showToast('Itinerary saved! Check your "Saved Guides" tab.');
    } catch (err) {
      console.error('Failed to save guide:', err);
      showToast('Could not save guide. Please try again.');
    } finally {
      setSavingGuideId(null);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      {/* Sleek Top Header Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lacvay-green/10 text-lacvay-green">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-gray-900">AI Travel Assistant</h1>
              <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-lacvay-green sm:inline-block">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Batangas City Route & Itinerary Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/saved?tab=guides')}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-lacvay-green hover:text-lacvay-green"
          >
            <Compass className="h-3.5 w-3.5 text-lacvay-green" />
            <span className="hidden sm:inline">Saved Guides</span>
          </button>
          <button
            type="button"
            onClick={clearAIMessages}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            title="Start fresh conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </header>

      {/* Scrollable Chat History Area (Full width, expanded text area for long itineraries) */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full space-y-7 px-4 py-6 sm:px-6 md:px-8 lg:px-12">
          {aiMessages.map((msg) => {
            const isAssistant = msg.role === 'assistant';
            const isSaved = savedGuideIds.has(msg.id);
            const isSaving = savingGuideId === msg.id;

            // User Message Bubble: Right-aligned, borderless, subtle gray background
            if (!isAssistant) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[88%] sm:max-w-[80%] lg:max-w-[70%] rounded-2xl bg-gray-100 px-5 py-3 text-[14.5px] leading-relaxed text-gray-900">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="mt-1.5 block text-right text-[10px] text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            }

            // AI Message: Left-aligned, borderless, transparent, flush readable text across full width
            return (
              <div key={msg.id} className="flex items-start gap-3.5 text-left">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green text-white shadow-sm mt-1">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>

                <div className="flex-1 min-w-0 text-[14.5px] leading-relaxed text-gray-800">
                  <MarkdownContent content={msg.content} isUser={false} className="text-[14.5px]" />

                  {/* Clean, borderless Action Row for AI Responses */}
                  {msg.id !== 'welcome' && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveGuide(msg)}
                        disabled={isSaving || isSaved}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition',
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-lacvay-green hover:text-lacvay-green hover:bg-emerald-50/40 shadow-sm',
                        )}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-lacvay-green" />
                            <span>Saving Guide...</span>
                          </>
                        ) : isSaved ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Saved to My Trips</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3 text-lacvay-green" />
                            <span>Save Guide to My Trips</span>
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking State */}
          {aiLoading && (
            <div className="flex items-start gap-3.5 text-left">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lacvay-green/15 text-lacvay-green mt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="flex items-center gap-2 py-1 text-sm text-gray-500">
                <span className="font-semibold text-lacvay-green">LACVAY AI</span>
                <span>is drafting your travel itinerary...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Bottom Input Area */}
      <footer className="shrink-0 border-t border-gray-100 bg-white/95 px-4 py-3.5 backdrop-blur pb-20 lg:pb-3.5 sm:px-6 md:px-8 lg:px-12">
        <div className="w-full space-y-2.5">
          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {aiSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void handleSend(s)}
                disabled={aiLoading}
                className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11.5px] font-medium text-gray-600 shadow-sm transition hover:border-lacvay-green hover:text-lacvay-green disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sleek, Pill-Shaped Input Box with subtle shadow */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="relative flex items-center rounded-full border border-gray-200 bg-white shadow-sm transition focus-within:border-lacvay-green focus-within:ring-2 focus-within:ring-lacvay-green/15"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about jeepneys, tricycle fares, top lomi houses, or full itineraries..."
              disabled={aiLoading}
              className="w-full rounded-full bg-transparent px-6 py-3.5 pr-14 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={aiLoading || !input.trim()}
              className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-lacvay-green text-white shadow-sm transition hover:bg-lacvay-green-dark disabled:opacity-30 disabled:hover:bg-lacvay-green"
              aria-label="Send message"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>

          <p className="text-center text-[10.5px] text-gray-400">
            LACVAY AI Assistant provides local travel recommendations for Batangas City.
          </p>
        </div>
      </footer>
    </div>
  );
}
