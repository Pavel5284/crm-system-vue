import { apiFetch } from '~/utils/api'
import type {
  ChatMessage,
  ChatMessagesQuery,
  ChatUser,
  Conversation,
  ConversationsError,
  GetMessagesError,
  MarkMessagesReadError,
  MarkMessagesReadResponse,
  SearchChatError,
  SendMessageError,
  SendMessagePayload,
  UnreadCount,
  UnreadCountError,
} from '~/types/backend.contracts'

export type {
  ChatMessage,
  ChatUser,
  Conversation,
  UnreadCount,
  ChatMessagesQuery,
  SendMessagePayload,
}

export const searchUsersApi = (q: string) =>
  apiFetch<ChatUser[], SearchChatError>('/users/search', { query: { q }, toast: false })

// альтернативно через /chat/search (тот же результат)
export const searchChatUsersApi = (q: string) =>
  apiFetch<ChatUser[], SearchChatError>('/chat/search', { query: { q }, toast: false })

export const getConversationsApi = () =>
  apiFetch<Conversation[], ConversationsError>('/chat/conversations', { toast: false })

export const getMessagesApi = (partnerId: string, params?: ChatMessagesQuery) => {
  const query: Record<string, string | number | boolean | undefined> = {}
  if (params?.limit !== undefined) query.limit = params.limit
  if (params?.offset !== undefined) query.offset = params.offset
  return apiFetch<ChatMessage[], GetMessagesError>(`/chat/messages/${partnerId}`, { query, toast: false })
}

export const sendMessageApi = (receiverId: string, text: string) =>
  apiFetch<ChatMessage, SendMessageError>('/chat/messages', {
    method: 'POST',
    body: { receiverId, text } satisfies SendMessagePayload,
  })

export const getUnreadCountApi = () =>
  apiFetch<UnreadCount, UnreadCountError>('/chat/unread-count', { toast: false })

export const markMessagesReadApi = (partnerId: string) =>
  apiFetch<MarkMessagesReadResponse, MarkMessagesReadError>(`/chat/messages/${partnerId}/read`, { method: 'PATCH', toast: false })
