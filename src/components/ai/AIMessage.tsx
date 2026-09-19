import { Check, Clipboard, Sparkles, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { AIMessage as AIMessageModel } from '@/hooks/useAIChat'

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

type Props = {
  message: AIMessageModel
  onRetry?: () => void
}

export const AIMessage = ({ message, onRetry }: Props) => {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === 'assistant'

  const copy = async () => {
    if (!message.content) return
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard permissions vary by browser; leaving the response selectable is a safe fallback.
    }
  }

  return (
    <article className={`flex gap-3 ${isAssistant ? 'items-start' : 'flex-row-reverse items-start'}`}>
      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${isAssistant ? 'bg-[var(--dni-primary)] text-white' : 'border border-gray-200 bg-white text-gray-500'}`}>
        {isAssistant ? <Sparkles size={15} /> : <UserRound size={15} />}
      </div>
      <div className={`group min-w-0 max-w-[min(720px,88%)] ${isAssistant ? '' : 'items-end'}`}>
        <div className={`relative rounded-sm px-4 py-3 text-[15px] leading-7 shadow-sm ${isAssistant ? 'border border-[var(--dni-cart-border)] bg-white text-gray-700' : 'bg-[var(--dni-primary)] text-white'}`}>
          {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : <span className="inline-flex gap-1 py-2"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" /></span>}
          {message.status === 'streaming' && message.content && <span className="ml-1 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-emerald-500" />}
        </div>
        <div className={`mt-1.5 flex items-center gap-3 px-1 text-[11px] text-slate-400 ${isAssistant ? '' : 'justify-end'}`}>
          <time>{formatTime(message.createdAt)}</time>
          {isAssistant && message.content && <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Copy response">{copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? 'Copied' : 'Copy'}</button>}
          {message.status === 'error' && <button type="button" onClick={onRetry} className="font-semibold text-rose-600 hover:text-rose-700">Try again</button>}
        </div>
      </div>
    </article>
  )
}
