import { useState, useRef, useEffect } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import {

  Sparkles,

  Send,

  Loader2,

  Bookmark,

  Check,

  Map,

} from 'lucide-react';

import { useApp } from '@/context/AppContext';

import { useAuth } from '@/context/AuthContext';

import { savedGuidesService } from '@/services/savedGuidesService';

import { usePromptLimit } from '@/hooks/usePromptLimit';

import { UpgradeModal } from '@/components/ui/UpgradeModal';

import { PromptCounter } from '@/components/ui/PromptCounter';

import {

  getStoredAiOrigin,

  setStoredAiOrigin,

  markManualAiOrigin,

  storeActiveCommutePlan,

} from '@/services/aiService';

import { AiOriginField } from '@/components/ai/AiOriginField';

import { MarkdownContent } from '@/components/ui/MarkdownContent';

import { cn } from '@/lib/utils';

import { buildFallbackCommutePlan, looksLikeCommuteReply } from '@/lib/commutePlanFromReply';

import { rebuildPlanPaths } from '@/lib/mapCoordinates';

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



  let title = 'Batangas City Trip Itinerary';

  const arrowTitle =

    content.match(/\*\*([^*]+?(?:→|->)[^*]+?)\*\*/) ||

    content.match(/^([^\n]{3,80}?(?:→|->)[^\n]{3,80})$/m);

  if (arrowTitle?.[1]) {

    title = arrowTitle[1].replace(/[*#]/g, '').trim();

  } else {

    for (const line of lines) {

      const clean = line.replace(/^[#* \t-]+/, '').replace(/[*#]/g, '').trim();

      if (

        clean.length > 5 &&

        clean.length < 80 &&

        !clean.toLowerCase().startsWith('here') &&

        !clean.toLowerCase().startsWith('magandang') &&

        !/^\d+[.)]/.test(clean)

      ) {

        title = clean;

        break;

      }

    }

  }



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

    aiSuggestions,

    showToast,

    aiOrigin,

    setAiOrigin,

  } = useApp();



  const { user } = useAuth();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();



  const [input, setInput] = useState('');

  const [savingGuideId, setSavingGuideId] = useState<string | null>(null);

  const [savedGuideIds, setSavedGuideIds] = useState<Set<string>>(new Set());

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);



  const { remainingPrompts, totalPrompts, isPremium, refreshUsage, usage } = usePromptLimit();



  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);



  const isFreshChat = aiMessages.length === 1 && aiMessages[0]?.id === 'welcome';



  useEffect(() => {

    const promptParam = searchParams.get('prompt') || searchParams.get('q');

    if (promptParam) {

      setInput(promptParam);

      inputRef.current?.focus();

    }

    const fromParam = searchParams.get('from');

    if (fromParam && fromParam !== 'Current Location') {

      setAiOrigin(fromParam);

      setStoredAiOrigin(fromParam);

      markManualAiOrigin();

    }

  }, [searchParams, setAiOrigin]);



  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [aiMessages, aiLoading]);



  const handleSend = async (text?: string) => {

    const msg = (text ?? input).trim();

    if (!msg || aiLoading) return;

    setInput('');

    await sendAI(msg);

    // Refresh usage after sending a prompt
    setTimeout(() => {

      refreshUsage();

      // Show upgrade modal if limit is reached (for free accounts)

      if (!isPremium && remainingPrompts <= 0) {

        setShowUpgradeModal(true);

      }

    }, 1000);

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

      const title = msg.plan?.title?.trim() || parsed.title;

      await savedGuidesService.saveGuide(user.id, {

        title,

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



  const handleViewOnCommuteGuide = (msg: AIMessage) => {

    const raw =

      msg.plan && msg.plan.legs?.length

        ? msg.plan

        : buildFallbackCommutePlan(msg.content, aiOrigin.trim() || getStoredAiOrigin() || undefined);



    if (!raw || !raw.legs?.length) {
      showToast('No map route for this reply yet — ask for a place-to-place commute.');
      return;
    }

    if (raw.origin?.outOfBounds || raw.destination?.outOfBounds) {
      showToast('Cannot plot route: Location is outside Batangas City.');
      return;
    }

    const plan = rebuildPlanPaths(raw);

    if (plan.origin?.outOfBounds || plan.destination?.outOfBounds || !plan.legs.length) {
      showToast('Cannot plot route: Location is outside Batangas City.');
      return;
    }

    storeActiveCommutePlan(plan);
    navigate('/commute', { state: { plan } });
  };

  const canViewOnGuide = (msg: AIMessage) => {
    if (msg.plan?.origin?.outOfBounds || msg.plan?.destination?.outOfBounds) {
      return false;
    }
    if (/out of bounds|outside batangas/i.test(msg.content)) {
      return false;
    }
    return Boolean(msg.plan?.legs?.length) || looksLikeCommuteReply(msg.content);
  };



  return (

    <div className="flex h-full flex-1 flex-col overflow-hidden bg-gradient-to-b from-lacvay-cream/80 to-white">

      {/* Mobile: From field when header row is tight */}

      <div className="shrink-0 border-b border-lacvay-green/5 bg-lacvay-cream/90 px-3 py-2 min-[480px]:hidden">

        <AiOriginField className="w-full max-w-none" />

      </div>



      <div className="flex-1 overflow-y-auto">

        <div className="w-full space-y-6 px-4 py-5 sm:px-6 md:px-8 lg:px-10">

          {isFreshChat && (

            <div className="rounded-2xl border border-lacvay-green/10 bg-white/80 px-4 py-3 text-center shadow-soft sm:px-6">

              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-lacvay-green text-white shadow-sm">

                <Sparkles className="h-5 w-5" />

              </div>

              <p className="text-sm font-semibold text-gray-900">Ask about routes, fares, and places</p>

              <p className="mt-1 text-xs text-gray-500">

                Starting from <span className="font-medium text-lacvay-green">{aiOrigin || 'your location'}</span>

              </p>

            </div>

          )}



          {aiMessages.map((msg) => {

            const isAssistant = msg.role === 'assistant';

            const isSaved = savedGuideIds.has(msg.id);

            const isSaving = savingGuideId === msg.id;



            if (!isAssistant) {

              return (

                <div key={msg.id} className="flex justify-end">

                  <div className="max-w-[88%] rounded-2xl rounded-br-md bg-lacvay-green px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-sm sm:max-w-[75%]">

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    <span className="mt-1 block text-right text-[10px] text-white/70">

                      {new Date(msg.timestamp).toLocaleTimeString([], {

                        hour: '2-digit',

                        minute: '2-digit',

                      })}

                    </span>

                  </div>

                </div>

              );

            }



            const isWelcome = msg.id === 'welcome';



            return (

              <div key={msg.id} className="flex items-start gap-3 text-left">

                <div

                  className={cn(

                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',

                    isWelcome ? 'bg-lacvay-green' : 'bg-lacvay-green/90',

                  )}

                >

                  <Sparkles className="h-4 w-4" />

                </div>



                <div

                  className={cn(

                    'min-w-0 flex-1 text-[14.5px] leading-relaxed text-gray-800',

                    !isWelcome && 'rounded-2xl rounded-tl-md border border-gray-100 bg-white px-4 py-3 shadow-soft',

                  )}

                >

                  <MarkdownContent content={msg.content} isUser={false} className="text-[14.5px]" />



                  {isWelcome && isFreshChat && (

                    <div className="mt-4 flex flex-wrap gap-2">

                      {aiSuggestions.map((s) => (

                        <button

                          key={s}

                          type="button"

                          onClick={() => void handleSend(s)}

                          disabled={aiLoading}

                          className="rounded-full border border-lacvay-green/15 bg-white px-3 py-1.5 text-left text-[11.5px] font-medium text-gray-700 shadow-xs transition hover:border-lacvay-green/40 hover:bg-lacvay-blush/50 hover:text-lacvay-green disabled:opacity-50"

                        >

                          {s}

                        </button>

                      ))}

                    </div>

                  )}



                  {!isWelcome && (

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">

                      {canViewOnGuide(msg) && (

                        <button

                          type="button"

                          onClick={() => handleViewOnCommuteGuide(msg)}

                          className="inline-flex items-center gap-1.5 rounded-full bg-lacvay-blush px-3 py-1.5 text-xs font-semibold text-lacvay-green transition hover:bg-lacvay-green hover:text-white"

                        >

                          <Map className="h-3 w-3" />

                          View on Commute Guide

                        </button>

                      )}



                      <button

                        type="button"

                        onClick={() => void handleSaveGuide(msg)}

                        disabled={isSaving || isSaved}

                        className={cn(

                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',

                          isSaved

                            ? 'bg-lacvay-blush/80 text-lacvay-green'

                            : 'border border-gray-200 bg-white text-gray-700 hover:border-lacvay-green hover:text-lacvay-green',

                        )}

                      >

                        {isSaving ? (

                          <>

                            <Loader2 className="h-3 w-3 animate-spin" />

                            Saving…

                          </>

                        ) : isSaved ? (

                          <>

                            <Check className="h-3 w-3" />

                            Saved

                          </>

                        ) : (

                          <>

                            <Bookmark className="h-3 w-3" />

                            Save guide

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



          {aiLoading && (

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lacvay-blush text-lacvay-green">

                <Loader2 className="h-4 w-4 animate-spin" />

              </div>

              <p className="py-1.5 text-sm text-gray-500">Planning your route…</p>

            </div>

          )}



          <div ref={messagesEndRef} />

        </div>

      </div>



      <footer className="shrink-0 border-t border-lacvay-green/8 bg-white/95 px-4 py-3 backdrop-blur pb-20 sm:px-6 md:px-8 lg:px-10 lg:pb-4">
        {!isPremium && usage && (
          <div className="mb-3">
            <PromptCounter
              remaining={remainingPrompts}
              total={totalPrompts}
              isPremium={isPremium}
            />
          </div>
        )}

        <form

          onSubmit={(e) => {

            e.preventDefault();

            void handleSend();

          }}

          className="relative flex w-full items-center rounded-2xl border border-gray-200 bg-white shadow-soft transition focus-within:border-lacvay-green focus-within:ring-2 focus-within:ring-lacvay-green/15"

        >

          <input

            ref={inputRef}

            type="text"

            value={input}

            onChange={(e) => setInput(e.target.value)}

            placeholder="Ask how to get there — e.g. Monte Maria"

            disabled={aiLoading}

            className="w-full rounded-2xl bg-transparent px-4 py-3.5 pr-14 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50 sm:px-5"

          />

          <button

            type="submit"

            disabled={aiLoading || !input.trim()}

            className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-lacvay-green text-white transition hover:bg-lacvay-green-dark disabled:opacity-30"

            aria-label="Send message"

          >

            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}

          </button>

        </form>

      </footer>

      <UpgradeModal

        open={showUpgradeModal}

        onClose={() => setShowUpgradeModal(false)}

        remaining_prompts={remainingPrompts}

        total_prompts={totalPrompts}

      />

    </div>

  );

}

