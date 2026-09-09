import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { cn } from '@/lib/utils';

export default function AIAssistantPage() {
  const {
    aiMessages,
    aiLoading,
    sendAI,
    aiSuggestions,
    chatSessions,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
  } = useApp();

  const { user } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const handleCreateNewChat = async () => {
    await createSession('New Conversation');
    inputRef.current?.focus();
  };

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl flex-col space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Sparkles className="h-6 w-6 text-lacvay-green" />
            AI Travel Assistant
          </h2>
          <p className="text-sm text-gray-500">
            Your friendly Batangas City guide powered by Google Gemini
          </p>
        </div>

        {/* Mobile / Quick Action Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-soft transition hover:border-lacvay-green md:hidden"
          >
            <MessageSquare className="h-3.5 w-3.5 text-lacvay-green" />
            {sidebarOpen ? 'Hide History' : 'Chat History'}
          </button>
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-lacvay-green px-4 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-lacvay-green-dark"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Main Chat Interface: Sidebar + Message Area */}
      <div className="flex flex-1 gap-4 overflow-hidden rounded-3xl bg-white p-2 shadow-card md:p-3">
        {/* Sessions Sidebar */}
        <aside
          className={cn(
            'flex flex-col border-r border-gray-100 bg-gray-50/70 p-3 transition-all duration-300 rounded-2xl',
            sidebarOpen ? 'w-full sm:w-64 md:w-72' : 'hidden md:flex md:w-16',
          )}
        >
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleCreateNewChat}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border border-lacvay-green/30 bg-lacvay-green/10 py-3 text-xs font-bold text-lacvay-green transition hover:bg-lacvay-green hover:text-white',
              !sidebarOpen && 'md:px-2 md:py-2.5',
            )}
            title="Start new conversation"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>New Conversation</span>}
          </button>

          {/* Guest / Account Banner */}
          {sidebarOpen && !user && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800">
              <p className="font-semibold">Guest Mode</p>
              <p className="mt-0.5 text-amber-700">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-bold underline hover:text-amber-900"
                >
                  Sign in
                </button>{' '}
                to permanently sync chat history across all your devices.
              </p>
            </div>
          )}

          {/* Chat Sessions List */}
          <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
            {sidebarOpen && (
              <p className="px-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
                Recent Chats
              </p>
            )}

            {chatSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => void selectSession(session.id)}
                  className={cn(
                    'group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-xs transition',
                    isActive
                      ? 'bg-white font-bold text-lacvay-green shadow-sm ring-1 ring-lacvay-green/20'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900',
                  )}
                  title={session.title}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isActive ? 'text-lacvay-green' : 'text-gray-400',
                      )}
                    />
                    {sidebarOpen && (
                      <span className="truncate">{session.title || 'Untitled Conversation'}</span>
                    )}
                  </div>

                  {sidebarOpen && chatSessions.length > 1 && (
                    <button
                      type="button"
                      aria-label="Delete chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteSession(session.id);
                      }}
                      className="opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Toggle Button */}
          <div className="hidden border-t border-gray-200/60 pt-2 md:block">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-medium text-gray-500 hover:bg-white"
            >
              {sidebarOpen ? (
                <>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </aside>

        {/* Chat Messages & Input Area */}
        <main
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            sidebarOpen && 'hidden sm:flex',
          )}
        >
          {/* Active Session Sub-header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2.5 pt-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-lacvay-green" />
              <h3 className="truncate text-xs font-bold text-gray-700">
                {activeSession?.title || 'New Conversation'}
              </h3>
            </div>
            <span className="text-[11px] text-gray-400">Batangas City Transport Guide</span>
          </div>

          {/* Message List */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {aiMessages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3',
                    isAssistant ? 'items-start' : 'items-start justify-end',
                  )}
                >
                  {/* Assistant Avatar */}
                  {isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lacvay-green to-lacvay-lime text-white shadow-soft">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'max-w-[88%] rounded-3xl p-4 sm:max-w-[80%]',
                      isAssistant
                        ? 'border border-gray-100 bg-gray-50/80 text-gray-800 shadow-soft'
                        : 'bg-lacvay-green text-white shadow-sm',
                    )}
                  >
                    <MarkdownContent content={msg.content} isUser={!isAssistant} />

                    <span
                      className={cn(
                        'mt-2 block text-[10px]',
                        isAssistant ? 'text-gray-400' : 'text-white/70 text-right',
                      )}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gray-200 text-gray-600">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Thinking Indicator */}
            {aiLoading && (
              <div className="flex items-center gap-3 text-gray-500">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-lacvay-green/10 text-lacvay-green">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-600 shadow-soft">
                  <span className="font-semibold text-lacvay-green">LACVAY AI</span> is preparing
                  your route & recommendations...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="border-t border-gray-100 px-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-gray-200 bg-gray-50/60 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-lacvay-green hover:bg-lacvay-green/5 hover:text-lacvay-green"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <div className="p-4 pt-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/70 p-1.5 pl-4 transition focus-within:border-lacvay-green focus-within:bg-white focus-within:ring-2 focus-within:ring-lacvay-green/15"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about jeepneys, fares, beaches, lomi spots..."
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={aiLoading || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lacvay-green text-white shadow-sm transition hover:bg-lacvay-green-dark disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
