import { useMemo, useState } from 'react'
import { ChevronRight, Search, Phone, Video, Info, Paperclip, Smile, SendHorizontal, CheckCheck, MessageCircle } from 'lucide-react'
import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'
import type { ChatMessage, Conversation } from '@/features/seller/types/chatTypes'

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Sarah Chen',
    status: 'Online',
    avatar: 'SC',
    preview: 'Also, I updated the component library wi...',
    date: 'Feb 22',
    unread: 2,
    messages: [
      { id: 'm1', author: 'me', text: 'Agreed. Should we schedule a review with the team?', time: '5:00 PM' },
      { id: 'm2', author: 'other', text: 'Good idea. How about tomorrow afternoon?', time: '5:05 PM' },
      { id: 'm3', author: 'me', text: "Works for me. I'll send out the invite.", time: '5:10 PM' },
      { id: 'm4', author: 'other', text: 'Hey, are you available for a quick sync today?', time: '6:00 PM' },
      { id: 'm5', author: 'me', text: "Sure! Let me wrap up this PR first. Give me 20 minutes?", time: '6:30 PM' },
      { id: 'm6', author: 'other', text: 'Perfect, no rush. Just ping me when you are ready.', time: '7:00 PM' },
      { id: 'm7', author: 'other', text: 'Also, I updated the component library with the new button variants.', time: '8:00 PM' },
    ],
  },
  {
    id: 'conv-2',
    name: 'Marcus Johnson',
    status: 'Away',
    avatar: 'MJ',
    preview: "Awesome. I'll start on the virtual scroll...",
    date: 'Feb 22',
    messages: [
      { id: 'm1', author: 'other', text: "Awesome. I'll start on the virtual scroll implementation.", time: '2:30 PM' },
      { id: 'm2', author: 'me', text: 'Perfect. I will review once your branch is ready.', time: '2:40 PM' },
    ],
  },
  {
    id: 'conv-3',
    name: 'Alex Rivera',
    status: 'Online',
    avatar: 'AR',
    preview: 'Will do!',
    date: 'Feb 21',
    messages: [{ id: 'm1', author: 'other', text: 'Will do!', time: '10:12 AM' }],
  },
  {
    id: 'conv-4',
    name: 'Design Team',
    status: 'Online',
    avatar: 'DT',
    preview: 'I can handle that. Will open a PR by EOD.',
    date: 'Feb 20',
    messages: [{ id: 'm1', author: 'other', text: 'I can handle that. Will open a PR by EOD.', time: '4:45 PM' }],
  },
  {
    id: 'conv-5',
    name: 'Priya Sharma',
    status: 'Away',
    avatar: 'PS',
    preview: 'Will do. Thanks Priya!',
    date: 'Feb 19',
    messages: [{ id: 'm1', author: 'me', text: 'Will do. Thanks Priya!', time: '9:22 AM' }],
  },
  {
    id: 'conv-6',
    name: 'Sprint Planning',
    status: 'Online',
    avatar: 'SP',
    preview: "Great. Let's reconvene Thursday for stan...",
    date: 'Feb 18',
    messages: [{ id: 'm1', author: 'other', text: "Great. Let's reconvene Thursday for standup.", time: '3:15 PM' }],
  },
]

type CommonChatPageProps = {
  area: DashboardArea
}

const CommonChatPage = ({ area }: CommonChatPageProps) => {
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [activeConversationId, setActiveConversationId] = useState('')
  const [conversationMessages, setConversationMessages] = useState<Record<string, ChatMessage[]>>(() =>
    Object.fromEntries(MOCK_CONVERSATIONS.map((conversation) => [conversation.id, conversation.messages])),
  )

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return MOCK_CONVERSATIONS
    return MOCK_CONVERSATIONS.filter((conversation) => {
      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.preview.toLowerCase().includes(query)
      )
    })
  }, [search])

  const activeConversation = MOCK_CONVERSATIONS.find((conversation) => conversation.id === activeConversationId) ?? null
  const activeMessages = activeConversation ? conversationMessages[activeConversation.id] ?? [] : []
  const pageTitle = area === 'super_admin' ? 'Admin Chat' : 'Chat'
  const subtitle = area === 'super_admin' ? 'Internal admin conversations.' : 'Messages and conversations.'

  const handleSendMessage = () => {
    if (!activeConversation) return
    const nextText = messageInput.trim()
    if (!nextText) return

    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const newMessage: ChatMessage = {
      id: `${activeConversation.id}-${Date.now()}`,
      author: 'me',
      text: nextText,
      time,
    }

    setConversationMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] ?? []), newMessage],
    }))
    setMessageInput('')
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>Dashboard</span>
        <ChevronRight size={12} />
        <span className="font-medium text-slate-700">Chat</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white md:min-w-[900px]">
          <div className="grid min-h-[400px] grid-cols-1 md:min-h-[620px] md:grid-cols-[270px_1fr]">
            <aside className="border-b border-slate-200 p-2.5 md:border-b-0 md:border-r">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[11px] outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>

              <div className="mt-3 max-h-[280px] space-y-1 overflow-y-auto pr-0.5 md:max-h-[560px]">
                {filteredConversations.map((conversation) => {
                  const isActive = activeConversationId === conversation.id
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setActiveConversationId(conversation.id)}
                      className={`flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                        isActive ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                        {conversation.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-slate-900">{conversation.name}</p>
                          <p className="text-[10px] text-slate-400">{conversation.date}</p>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${conversation.status === 'Online' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
                          <p className="truncate text-[11px] text-slate-500">{conversation.preview}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {filteredConversations.length === 0 && (
                  <div className="px-2 py-6 text-center text-xs text-slate-400">No conversations found.</div>
                )}
              </div>
            </aside>

            <div className="flex min-h-[620px] flex-col">
              {activeConversation ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                        {activeConversation.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{activeConversation.name}</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${activeConversation.status === 'Online' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
                          {activeConversation.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <button type="button" className="cursor-pointer rounded-md p-1.5 hover:bg-slate-100" aria-label="Call">
                        <Phone size={14} />
                      </button>
                      <button type="button" className="cursor-pointer rounded-md p-1.5 hover:bg-slate-100" aria-label="Video call">
                        <Video size={14} />
                      </button>
                      <button type="button" className="cursor-pointer rounded-md p-1.5 hover:bg-slate-100" aria-label="Chat info">
                        <Info size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto bg-white px-3 py-3">
                    {activeMessages.slice(0, 3).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.author === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[66%] rounded-2xl px-3 py-2 text-xs ${
                            message.author === 'me'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className={`mt-1 text-[10px] ${message.author === 'me' ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {message.time}
                            {message.author === 'me' && <CheckCheck size={10} className="ml-1 inline-block" />}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-slate-200" />
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">February 22, 2026</p>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {activeMessages.slice(3).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.author === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[66%] rounded-2xl px-3 py-2 text-xs ${
                            message.author === 'me'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className={`mt-1 text-[10px] ${message.author === 'me' ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {message.time}
                            {message.author === 'me' && <CheckCheck size={10} className="ml-1 inline-block" />}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 p-2.5">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                      <button type="button" className="cursor-pointer rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Attach file">
                        <Paperclip size={14} />
                      </button>
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full border-0 bg-transparent px-1 text-xs text-slate-700 outline-none placeholder:text-slate-400"
                      />
                      <button type="button" className="cursor-pointer rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Emoji">
                        <Smile size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="cursor-pointer rounded-full bg-emerald-500 p-1.5 text-white hover:bg-emerald-600"
                        aria-label="Send message"
                      >
                        <SendHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="mb-3 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500">
                    <MessageCircle size={18} />
                  </div>
                  <p className="text-xl font-semibold text-slate-800">Select a conversation</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommonChatPage