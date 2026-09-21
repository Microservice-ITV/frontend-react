import { store } from '@/app/store'

type AIStreamEventMap = {
  message_start: { conversationId: string | null }
  text_delta: { delta: string }
  activity: { status: 'started' | 'completed' }
  session: { token: string }
  completion: { conversationId: string; runId: string; responseId: string }
  error: { code: string; message: string }
}

type StreamEventName = keyof AIStreamEventMap

export type AIStreamEvent = {
  [Name in StreamEventName]: { type: Name; data: AIStreamEventMap[Name] }
}[StreamEventName]

export type AIChatRequest = {
  conversationId?: string
  sessionToken?: string
  message: string
}

type EventDataGuard<Name extends StreamEventName> = (
  value: unknown,
) => value is AIStreamEventMap[Name]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isMessageStartData: EventDataGuard<'message_start'> = (value) =>
  isRecord(value) && (value.conversationId === null || typeof value.conversationId === 'string')

const isTextDeltaData: EventDataGuard<'text_delta'> = (value) =>
  isRecord(value) && typeof value.delta === 'string'

const isActivityData: EventDataGuard<'activity'> = (value) =>
  isRecord(value) && (value.status === 'started' || value.status === 'completed')

const isSessionData: EventDataGuard<'session'> = (value) =>
  isRecord(value) && typeof value.token === 'string'

const isCompletionData: EventDataGuard<'completion'> = (value) =>
  isRecord(value) &&
  typeof value.conversationId === 'string' &&
  typeof value.runId === 'string' &&
  typeof value.responseId === 'string'

const isErrorData: EventDataGuard<'error'> = (value) =>
  isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string'

const parseTypedEvent = <Name extends StreamEventName>(
  type: Name,
  rawData: string,
  isValidData: EventDataGuard<Name>,
): { type: Name; data: AIStreamEventMap[Name] } | null => {
  try {
    const parsed: unknown = JSON.parse(rawData)
    return isValidData(parsed) ? { type, data: parsed } : null
  } catch {
    return null
  }
}

const parseEventData = (eventName: StreamEventName, rawData: string): AIStreamEvent | null => {
  switch (eventName) {
    case 'message_start':
      return parseTypedEvent(eventName, rawData, isMessageStartData)
    case 'text_delta':
      return parseTypedEvent(eventName, rawData, isTextDeltaData)
    case 'activity':
      return parseTypedEvent(eventName, rawData, isActivityData)
    case 'session':
      return parseTypedEvent(eventName, rawData, isSessionData)
    case 'completion':
      return parseTypedEvent(eventName, rawData, isCompletionData)
    case 'error':
      return parseTypedEvent(eventName, rawData, isErrorData)
  }
}

const toStreamEventName = (value: string): StreamEventName | null => {
  switch (value) {
    case 'message_start':
    case 'text_delta':
    case 'activity':
    case 'session':
    case 'completion':
    case 'error':
      return value
    default:
      return null
  }
}

/** Absolute BFF origin when configured (Docker/production build); dev falls back to the Vite proxy path. */
const bffPath = (path: string): string => {
  const baseUrl = import.meta.env.VITE_BFF_SERVICE_URL?.replace(/\/$/, '')
  return baseUrl ? `${baseUrl}${path}` : path
}

const getStreamUrl = (): string => bffPath('/api/v1/ai/chat/stream')

export type AIConversationSummary = {
  conversationId: string
  title: string
  lastMessageAt: string | null
  createdAt: string
}

export type AIConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const historyHeaders = (): Record<string, string> => {
  const accessToken = store.getState().auth.accessToken
  return {
    Accept: 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}

/**
 * Conversation history is scoped by the BFF: the authenticated JWT subject, or the signed anonymous
 * session token. The browser never sends a customer id.
 */
const requestHistory = async <T>(path: string, sessionToken?: string): Promise<T[]> => {
  const query = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ''
  const response = await fetch(`${bffPath(path)}${query}`, {
    credentials: 'include',
    headers: historyHeaders(),
  })

  if (!response.ok) {
    const failure = new Error(`Conversation history is unavailable (${response.status}).`) as Error & { status?: number }
    failure.status = response.status
    throw failure
  }

  const body: unknown = await response.json()
  const data = isRecord(body) ? body.data : undefined
  return Array.isArray(data) ? (data as T[]) : []
}

export const listAIConversations = (sessionToken?: string): Promise<AIConversationSummary[]> =>
  requestHistory<AIConversationSummary>('/api/v1/ai/conversations', sessionToken)

export const fetchAIConversationMessages = (
  conversationId: string,
  sessionToken?: string,
): Promise<AIConversationMessage[]> =>
  requestHistory<AIConversationMessage>(
    `/api/v1/ai/conversations/${encodeURIComponent(conversationId)}/messages`,
    sessionToken,
  )

export async function streamAIChat(
  request: AIChatRequest,
  onEvent: (event: AIStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const accessToken = store.getState().auth.accessToken
  const response = await fetch(getStreamUrl(), {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(request),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Unable to connect to the shopping assistant (${response.status}).`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName: StreamEventName | null = null
  let eventData = ''

  const flushEvent = () => {
    if (!eventName || !eventData) return
    const event = parseEventData(eventName, eventData)
    if (event) onEvent(event)
    eventName = null
    eventData = ''
  }

  while (true) {
    const chunk = await reader.read()
    if (chunk.done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(chunk.value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '')
      if (line === '') {
        flushEvent()
      } else if (line.startsWith('event: ')) {
        eventName = toStreamEventName(line.slice(7))
      } else if (line.startsWith('data: ')) {
        eventData += line.slice(6)
      }
    }
  }

  if (buffer.trim()) {
    for (const rawLine of buffer.split('\n')) {
      const line = rawLine.replace(/\r$/, '')
      if (line.startsWith('event: ')) {
        eventName = toStreamEventName(line.slice(7))
      } else if (line.startsWith('data: ')) {
        eventData += line.slice(6)
      }
    }
  }
  flushEvent()
}
