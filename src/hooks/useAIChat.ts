import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import {
  fetchAIConversationMessages,
  listAIConversations,
  streamAIChat,
  type AIConversationSummary,
  type AIStreamEvent,
} from '@/services/aiChatService'

export type AIMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  status?: 'streaming' | 'error'
}

type StoredSession = {
  conversationId?: string
  sessionToken?: string
  /** True when the stored conversation was created while signed in. */
  authenticated?: boolean
}

export type AIHistoryStatus = 'idle' | 'loading' | 'ready' | 'failed'

const SESSION_KEY = 'dni.ai.website-session'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readSession = (): StoredSession => {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return {}
    const parsed: unknown = JSON.parse(stored)
    if (!isRecord(parsed)) return {}
    return {
      ...(typeof parsed.conversationId === 'string' ? { conversationId: parsed.conversationId } : {}),
      ...(typeof parsed.sessionToken === 'string' ? { sessionToken: parsed.sessionToken } : {}),
      ...(parsed.authenticated === true ? { authenticated: true } : {}),
    }
  } catch {
    return {}
  }
}

const saveSession = (session: StoredSession) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Storage is an enhancement; the live conversation still works without it.
  }
}

const createMessage = (role: AIMessage['role'], content: string, status?: AIMessage['status']): AIMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  ...(status ? { status } : {}),
})

/**
 * Website shopping assistant: SSE streaming, anonymous session handling and per-customer history.
 *
 * The active conversation survives navigation and refresh through localStorage, but it always stays
 * scoped to the current auth mode: an anonymous conversation is never reused after signing in.
 */
export const useAIChat = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [activity, setActivity] = useState<'idle' | 'thinking' | 'tool'>('idle')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<AIConversationSummary[]>([])
  const [historyStatus, setHistoryStatus] = useState<AIHistoryStatus>('idle')
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(
    () => readSession().conversationId,
  )
  const sessionRef = useRef<StoredSession>(readSession())
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
    setActivity('idle')
  }, [])

  // Signing in starts a fresh authenticated conversation and signing out drops it again, so an
  // anonymous conversation id is never sent with a JWT (and an authenticated one is never sent anonymously).
  useEffect(() => {
    const session = sessionRef.current
    const hasAnonymousConversation = Boolean(session.conversationId) && session.authenticated !== true
    const hasAuthenticatedConversation = session.authenticated === true

    if (!isAuthenticated && !hasAuthenticatedConversation) return
    if (isAuthenticated && !hasAnonymousConversation) return

    stop()
    sessionRef.current = isAuthenticated ? { authenticated: true } : {}
    saveSession(sessionRef.current)
    setMessages([])
    setError(null)
    setActiveConversationId(undefined)
    setConversations([])
    setHistoryStatus('idle')
  }, [isAuthenticated, stop])

  const send = useCallback(
    async (content: string) => {
      const message = content.trim()
      if (!message || isStreaming) return

      setError(null)
      setMessages((current) => [...current, createMessage('user', message), createMessage('assistant', '', 'streaming')])
      setIsStreaming(true)
      setActivity('thinking')
      const controller = new AbortController()
      abortRef.current = controller

      const updateAssistant = (updater: (current: AIMessage) => AIMessage) => {
        setMessages((current) => {
          const next = [...current]
          const index = next.length - 1
          if (next[index]?.role === 'assistant') next[index] = updater(next[index])
          return next
        })
      }

      try {
        const session = sessionRef.current
        await streamAIChat(
          {
            ...(session.conversationId ? { conversationId: session.conversationId } : {}),
            ...(!isAuthenticated && session.sessionToken ? { sessionToken: session.sessionToken } : {}),
            message,
          },
          (event: AIStreamEvent) => {
            if (event.type === 'text_delta') {
              setActivity('idle')
              updateAssistant((current) => ({ ...current, content: `${current.content}${event.data.delta}` }))
            } else if (event.type === 'activity') {
              setActivity(event.data.status === 'started' ? 'tool' : 'thinking')
            } else if (event.type === 'session') {
              if (isAuthenticated) return
              sessionRef.current = { ...sessionRef.current, sessionToken: event.data.token }
              saveSession(sessionRef.current)
            } else if (event.type === 'completion') {
              sessionRef.current = {
                ...sessionRef.current,
                conversationId: event.data.conversationId,
                ...(isAuthenticated ? { authenticated: true } : {}),
              }
              saveSession(sessionRef.current)
              setActiveConversationId(event.data.conversationId)
            } else if (event.type === 'error') {
              throw new Error(event.data.message)
            }
          },
          controller.signal,
        )
        updateAssistant((current) => ({ ...current, status: undefined }))
      } catch (caught: unknown) {
        if (controller.signal.aborted) return
        const messageText = caught instanceof Error ? caught.message : 'The assistant could not respond. Please try again.'
        setError(messageText)
        updateAssistant((current) => ({ ...current, status: 'error' }))
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setIsStreaming(false)
        setActivity('idle')
      }
    },
    [isAuthenticated, isStreaming],
  )

  const retry = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
    if (!lastUserMessage || isStreaming) return
    setMessages((current) => current.slice(0, -1))
    await send(lastUserMessage.content)
  }, [isStreaming, messages, send])

  /** Previous conversations for the current caller: the JWT customer, or the anonymous session. */
  const refreshHistory = useCallback(async () => {
    setHistoryStatus('loading')
    try {
      const list = await listAIConversations(isAuthenticated ? undefined : sessionRef.current.sessionToken)
      setConversations(list)
      setHistoryStatus('ready')
    } catch {
      setConversations([])
      setHistoryStatus('failed')
    }
  }, [isAuthenticated])

  /** Opens a stored conversation and shows its transcript in the assistant. */
  const openConversation = useCallback(
    async (conversationId: string) => {
      setError(null)
      try {
        const stored = await fetchAIConversationMessages(
          conversationId,
          isAuthenticated ? undefined : sessionRef.current.sessionToken,
        )
        setMessages(
          stored.map((entry) => ({
            id: entry.id,
            role: entry.role,
            content: entry.content,
            createdAt: entry.createdAt,
          })),
        )
        sessionRef.current = {
          ...sessionRef.current,
          conversationId,
          ...(isAuthenticated ? { authenticated: true } : {}),
        }
        saveSession(sessionRef.current)
        setActiveConversationId(conversationId)
      } catch {
        setError('That conversation could not be opened. Please try again.')
      }
    },
    [isAuthenticated],
  )

  const reset = useCallback(() => {
    stop()
    sessionRef.current = isAuthenticated ? { authenticated: true } : {}
    saveSession(sessionRef.current)
    setMessages([])
    setError(null)
    setActiveConversationId(undefined)
  }, [isAuthenticated, stop])

  return {
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
  }
}
