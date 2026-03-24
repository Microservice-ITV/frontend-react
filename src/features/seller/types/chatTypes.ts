export type ChatMessage = {
  id: string
  author: 'me' | 'other'
  text: string
  time: string
}

export type Conversation = {
  id: string
  name: string
  status: 'Online' | 'Away'
  avatar: string
  preview: string
  date: string
  unread?: number
  messages: ChatMessage[]
}