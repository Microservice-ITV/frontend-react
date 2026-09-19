import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react'
import { Clock3, Maximize2, MessageSquarePlus, Minimize2, Minus, Send, Sparkles, Square, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { AIMessage } from '@/components/ai/AIMessage'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import {
  closeAiAssistant,
  closeAiHistory,
  minimizeAiAssistant,
  restoreAiAssistant,
  selectAiAssistantPanel,
  toggleAiAssistant,
  toggleAiAssistantSize,
  toggleAiHistory,
} from '@/features/ai/store/aiAssistantSlice'
import { useAIChat } from '@/hooks/useAIChat'

const PROMPTS = [
  'Find a thoughtful gift under my budget',
  'Help me compare options for my home',
  'What is new and worth exploring?',
]

const formatWhen = (value: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Global website assistant: a floating launcher at the bottom-right plus a compact chat panel that
 * reuses the storefront design tokens. It never opens on its own; the visitor or the navbar
 * "AI Shopping" entry opens it.
 *
 * The launcher and panel are offset above the bottom-right corner (bottom-24 = 96px) and stay far
 * below the reCAPTCHA badge z-index, so Google's bottom-right reCAPTCHA badge is never covered or
 * blocked.
 */
export const AIAssistantWidget = () => {
  const dispatch = useAppDispatch()
  const panel = useAppSelector(selectAiAssistantPanel)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const {
    messages,
    activity,
    isStreaming,
    error,
    conversations,
    historyStatus,
    activeConversationId,
    send,
    retry,
    reset,
    stop,
    refreshHistory,
    openConversation,
  } = useAIChat()
  const [draft, setDraft] = useState('')
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasConversation = messages.length > 0

  useEffect(() => {
    if (panel.isOpen && panel.isHistoryOpen) void refreshHistory()
  }, [panel.isOpen, panel.isHistoryOpen, refreshHistory])

  useEffect(() => {
    if (panel.isOpen) transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, activity, panel.isOpen])

  // Escape minimizes instead of closing so the transcript is not lost.
  useEffect(() => {
    if (!panel.isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(minimizeAiAssistant())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [panel.isOpen, dispatch])

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const message = draft.trim()
    if (!message || isStreaming) return
    setDraft('')
    void send(message)
  }

  const onComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const startNewChat = () => {
    reset()
    dispatch(closeAiHistory())
    textareaRef.current?.focus()
  }

  const openPreviousConversation = (conversationId: string) => {
    void openConversation(conversationId)
    dispatch(closeAiHistory())
  }

  const controlButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-[var(--dni-primary)]'

  if (!panel.isOpen) {
    return (
      <button
        type="button"
        onClick={() => dispatch(panel.isMinimized ? restoreAiAssistant() : toggleAiAssistant())}
        className="fixed right-4 bottom-24 z-[80] inline-flex items-center gap-2 rounded-sm bg-[var(--dni-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-colors hover:bg-[var(--dni-primary-hover)] sm:right-6 sm:bottom-24"
        aria-label={panel.isMinimized ? 'Resume the shopping assistant chat' : 'Open the shopping assistant'}
      >
        <Sparkles size={16} />
        <span>{panel.isMinimized ? 'Resume chat' : 'Ask AI'}</span>
        {panel.isMinimized && hasConversation && (
          <span className="inline-flex h-2 w-2 rounded-full bg-white/90" aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <section
      className={`fixed inset-x-0 top-0 bottom-24 z-[80] flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-24 sm:rounded-sm sm:border sm:border-[var(--dni-cart-border)] sm:shadow-[0_10px_34px_rgba(0,0,0,0.22)] ${
        panel.isMaximized ? 'sm:h-[min(82vh,760px)] sm:w-[min(92vw,720px)]' : 'sm:h-[560px] sm:w-[min(92vw,380px)]'
      }`}
      aria-label="Shopping assistant"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--dni-cart-border)] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[var(--dni-primary)] text-white">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">Shopping assistant</p>
            <p className="truncate text-[11px] text-gray-500">
              {isStreaming ? 'Working...' : activity === 'tool' ? 'Checking the store...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={() => dispatch(toggleAiHistory())} className={controlButton} aria-label="Previous conversations">
            <Clock3 size={15} />
          </button>
          <button type="button" onClick={startNewChat} className={controlButton} aria-label="Start a new chat">
            <MessageSquarePlus size={15} />
          </button>
          <button type="button" onClick={() => dispatch(minimizeAiAssistant())} className={controlButton} aria-label="Minimize assistant">
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={() => dispatch(toggleAiAssistantSize())}
            className={controlButton}
            aria-label={panel.isMaximized ? 'Restore assistant size' : 'Maximize assistant'}
          >
            {panel.isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button type="button" onClick={() => dispatch(closeAiAssistant())} className={controlButton} aria-label="Close assistant">
            <X size={16} />
          </button>
        </div>
      </header>

      {panel.isHistoryOpen && (
        <div className="absolute inset-0 z-10 flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--dni-cart-border)] px-3 py-2.5">
            <p className="text-sm font-semibold text-gray-900">Previous conversations</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={startNewChat} className="text-xs font-semibold text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)]">
                New chat
              </button>
              <button type="button" onClick={() => dispatch(closeAiHistory())} className={controlButton} aria-label="Close conversation history">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {historyStatus === 'loading' && <p className="px-3 py-4 text-sm text-gray-500">Loading your conversations...</p>}
            {historyStatus === 'failed' && (
              <p className="px-3 py-4 text-sm text-gray-500">Conversations could not be loaded. Please try again.</p>
            )}
            {historyStatus !== 'loading' && conversations.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-500">
                {isAuthenticated
                  ? 'No previous conversations yet.'
                  : 'No previous conversations yet. Sign in to keep your chats across visits.'}
              </p>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.conversationId}
                type="button"
                onClick={() => openPreviousConversation(conversation.conversationId)}
                className={`w-full border-b border-[var(--dni-cart-border)] px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${
                  conversation.conversationId === activeConversationId ? 'bg-[var(--dni-primary-soft)]' : ''
                }`}
              >
                <p className="truncate text-sm font-medium text-gray-800">{conversation.title}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatWhen(conversation.lastMessageAt ?? conversation.createdAt)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {!hasConversation ? (
            <div className="flex h-full flex-col items-center justify-center px-2 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-[var(--dni-primary)] text-white">
                <Sparkles size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold text-gray-900">How can I help you shop today?</p>
              <p className="mt-1 text-xs text-gray-500">Ask about products, prices, stock, delivery or an order.</p>
              <div className="mt-4 flex w-full flex-col gap-2">
                {PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setDraft(prompt)
                      textareaRef.current?.focus()
                    }}
                    className="rounded-sm border border-[var(--dni-cart-border)] px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:border-[var(--dni-primary)] hover:text-[var(--dni-primary)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <AIMessage
                  key={message.id}
                  message={message}
                  {...(message.role === 'assistant' && index === messages.length - 1
                    ? { onRetry: () => void retry() }
                    : {})}
                />
              ))}
              {error && (
                <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div ref={transcriptEndRef} />
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--dni-cart-border)] bg-white px-3 py-3">
          <form
            onSubmit={submit}
            className="flex items-end gap-2 border border-gray-300 bg-white p-2 shadow-sm transition focus-within:border-[var(--dni-primary)]"
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              rows={1}
              placeholder="Ask about products, gifts, or a specific need..."
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-400"
              aria-label="Message the shopping assistant"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gray-800 text-white transition-colors hover:bg-gray-700"
                aria-label="Stop generating"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[var(--dni-primary)] text-white shadow-sm transition-colors hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            )}
          </form>
          <p className="mt-1.5 text-center text-[11px] text-gray-400">Enter to send - Shift + Enter for a new line</p>
        </div>
      </div>
    </section>
  )
}

export default AIAssistantWidget
