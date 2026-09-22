import { apiFetch } from '~/utils/api'
import type {
  ChatMessage,
  ChatMessagesQuery,
  ChatUser,
  Conversation,
  ConversationsError,
  GetMessagesError,
  MarkMessagesReadError,
  MarkMessagesReadPayload,
  MarkMessagesReadResponse,
  SearchChatError,
  SendMessageError,
  SendMessagePayload,
  UnreadCount,
  UnreadCountError,
  UnreadDialogs,
  UnreadDialogsError,
} from '~/types/backend.contracts'

export type {
  ChatMessage,
  ChatUser,
  Conversation,
  UnreadCount,
  ChatMessagesQuery,
  SendMessagePayload,
}

export const searchUsersApi = (
  q: string,
  opts?: { page?: number; limit?: number; includeSelf?: boolean },
) =>
  apiFetch<ChatUser[], SearchChatError>('/users/search', {
    query: {
      q,
      page: opts?.page,
      limit: opts?.limit,
      includeSelf: opts?.includeSelf,
    },
    toast: false,
  })

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

export const getUnreadDialogsApi = () =>
  apiFetch<UnreadDialogs, UnreadDialogsError>('/chat/unread-dialogs', { toast: false })

export const markMessagesReadApi = (upToMessageId: string) =>
  apiFetch<MarkMessagesReadResponse, MarkMessagesReadError>('/chat/messages/read', {
    method: 'PATCH',
    body: { upToMessageId } satisfies MarkMessagesReadPayload,
    toast: false,
  })
