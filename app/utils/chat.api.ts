import { apiFetch } from '~/utils/api'

export interface ChatUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  position?: string | null
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  text: string
  read: boolean
  createdAt: string
}

export interface Conversation {
  partner: ChatUser
  lastMessage: ChatMessage
}

export const searchUsersApi = (q: string) =>
  apiFetch<ChatUser[]>('/users/search', { query: { q }, toast: false })

// альтернативно через /chat/search (тот же результат)
export const searchChatUsersApi = (q: string) =>
  apiFetch<ChatUser[]>('/chat/search', { query: { q }, toast: false })

export const getConversationsApi = () =>
  apiFetch<Conversation[]>('/chat/conversations', { toast: false })

export const getMessagesApi = (partnerId: string, params?: { limit?: number; offset?: number }) =>
  apiFetch<ChatMessage[]>(`/chat/messages/${partnerId}`, { query: params as Record<string, string|number>, toast: false })

export const sendMessageApi = (receiverId: string, text: string) =>
  apiFetch<ChatMessage>('/chat/messages', { method: 'POST', body: { receiverId, text } })

export const getUnreadCountApi = () =>
  apiFetch<{ count: number }>('/chat/unread-count', { toast: false })
