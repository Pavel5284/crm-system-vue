import { defineStore } from 'pinia'
import type { ChatUser, ChatMessage, Conversation } from '~/utils/chat.api'
import { getConversationsApi, getMessagesApi, getUnreadCountApi, sendMessageApi } from '~/utils/chat.api'

const STORAGE_KEY = 'chat_mock_messages'

type MockMessage = ChatMessage & { _mock?: boolean }

function loadMockMessages(): MockMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveMockMessages(list: MockMessage[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-500))) } catch {}
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [] as Conversation[],
    messagesByPartner: {} as Record<string, ChatMessage[]>,
    selectedPartner: null as ChatUser | null,
    searchResults: [] as ChatUser[],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isSending: false,
    isSearching: false,
    unreadCount: 0,
  }),
  getters: {
    selectedMessages(state): ChatMessage[] {
      if (!state.selectedPartner) return []
      return state.messagesByPartner[state.selectedPartner.id] ?? []
    },
  },
  actions: {
    async fetchUnreadCount() {
      try {
        const { count } = await getUnreadCountApi()
        this.unreadCount = count
      } catch {
        // fallback: считаем из моков
        const mock = loadMockMessages()
        const auth = useAuthStore()
        const myId = auth.user.id || auth.user.email
        this.unreadCount = mock.filter(m => m.receiverId === myId && !m.read).length
      }
    },
    async searchUsers(q: string) {
      if (!q.trim()) {
        this.searchResults = []
        return
      }
      this.isSearching = true
      try {
        const { searchUsersApi } = await import('~/utils/chat.api')
        this.searchResults = await searchUsersApi(q)
      } catch {
        // fallback: поиск среди моков + текущего authStore если нет бэка
        this.searchResults = []
      } finally {
        this.isSearching = false
      }
    },
    async loadConversations() {
      this.isLoadingConversations = true
      try {
        this.conversations = await getConversationsApi()
        // очистить старые моки с UUID-именами после успешной загрузки реальных данных
        if (this.conversations.length) {
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
        }
        await this.fetchUnreadCount()
      } catch {
        // fallback: строим из моков (только если бэкенд недоступен)
        const mock = loadMockMessages()
        const auth = useAuthStore()
        const myId = auth.user.id || auth.user.email
        const map = new Map<string, { partner: ChatUser; lastMessage: MockMessage }>()
        for (const m of [...mock].reverse()) {
          const partnerId = m.senderId === myId ? m.receiverId : m.senderId
          if (!map.has(partnerId)) {
            const existing = this.searchResults.find(u => u.id === partnerId)
            const partner: ChatUser = existing ?? { id: partnerId, name: partnerId, email: partnerId, avatarUrl: null }
            // если имя - UUID, пробуем найти реальный email в моке
            if (/^[0-9a-f-]{36}$/i.test(partner.name)) {
              partner.name = partner.email
            }
            map.set(partnerId, { partner, lastMessage: m })
          }
        }
        this.conversations = Array.from(map.values()) as Conversation[]
        await this.fetchUnreadCount()
      } finally {
        this.isLoadingConversations = false
      }
    },
    async loadMessages(partnerId: string) {
      this.isLoadingMessages = true
      try {
        const msgs = await getMessagesApi(partnerId)
        this.messagesByPartner[partnerId] = msgs
        // бэкенд пометил входящие как read, обновим счетчик
        await this.fetchUnreadCount()
      } catch {
        const filtered = loadMockMessages().filter(m => m.senderId === partnerId || m.receiverId === partnerId)
        this.messagesByPartner[partnerId] = filtered as ChatMessage[]
        // пометить локально как прочитанные
        const mock = loadMockMessages()
        let changed = false
        const myId = useAuthStore().user.id || useAuthStore().user.email
        for (const m of mock) if (m.receiverId === myId && m.senderId === partnerId && !m.read) { m.read = true; changed = true }
        if (changed) saveMockMessages(mock)
        await this.fetchUnreadCount()
      } finally {
        this.isLoadingMessages = false
      }
    },
    async selectPartner(user: ChatUser) {
      this.selectedPartner = user
      await this.loadMessages(user.id)
    },
    async sendMessage(text: string) {
      if (!this.selectedPartner || !text.trim()) return
      const partnerId = this.selectedPartner.id
      this.isSending = true
      try {
        const msg = await sendMessageApi(partnerId, text.trim())
        if (!this.messagesByPartner[partnerId]) this.messagesByPartner[partnerId] = []
        // дедуп: если уже пришло по сокету
        if (this.messagesByPartner[partnerId].some(m => m.id === msg.id)) {
          // обновить conversation и выйти
          const idx = this.conversations.findIndex(c => c.partner.id === partnerId)
          if (idx >= 0) {
            // если partner был UUID - заменить на корректный
            if (/^[0-9a-f-]{36}$/i.test(this.conversations[idx]!.partner.name)) {
              this.conversations[idx]!.partner = { ...this.selectedPartner }
            }
            this.conversations[idx]!.lastMessage = msg
            const conv = this.conversations.splice(idx, 1)[0]!
            this.conversations.unshift(conv)
          }
          return
        }
        this.messagesByPartner[partnerId].push(msg)
        // обновить conversation preview
        const idx = this.conversations.findIndex(c => c.partner.id === partnerId)
        if (idx >= 0) {
          // если имя - UUID, заменить
          if (/^[0-9a-f-]{36}$/i.test(this.conversations[idx]!.partner.name)) {
            this.conversations[idx]!.partner = { ...this.selectedPartner }
          }
          this.conversations[idx]!.lastMessage = msg
          // поднять наверх
          const conv = this.conversations.splice(idx, 1)[0]!
          this.conversations.unshift(conv)
        } else {
          this.conversations.unshift({ partner: this.selectedPartner, lastMessage: msg })
        }
      } catch {
        // fallback mock
        const auth = useAuthStore()
        const mockMsg: MockMessage = {
          id: Math.random().toString(36).slice(2),
          senderId: auth.user.id || auth.user.email || 'me',
          receiverId: partnerId,
          text: text.trim(),
          read: false,
          createdAt: new Date().toISOString(),
          _mock: true,
        }
        if (!this.messagesByPartner[partnerId]) this.messagesByPartner[partnerId] = []
        this.messagesByPartner[partnerId].push(mockMsg)
        const all = loadMockMessages()
        all.push(mockMsg)
        saveMockMessages(all)
        const idx = this.conversations.findIndex(c => c.partner.id === partnerId)
        if (idx >= 0) {
          this.conversations[idx]!.lastMessage = mockMsg
          const conv = this.conversations.splice(idx, 1)[0]!
          this.conversations.unshift(conv)
        } else {
          this.conversations.unshift({ partner: this.selectedPartner, lastMessage: mockMsg as ChatMessage })
        }
      } finally {
        this.isSending = false
      }
    },
    receiveMessage(msg: ChatMessage) {
      const auth = useAuthStore()
      const myId = auth.user.id || auth.user.email
      const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId
      if (!this.messagesByPartner[partnerId]) this.messagesByPartner[partnerId] = []
      // дедуп
      if (this.messagesByPartner[partnerId].some(m => m.id === msg.id)) return
      this.messagesByPartner[partnerId].push(msg)
      // обновить conversation
      const idx = this.conversations.findIndex(c => c.partner.id === partnerId)
      if (idx >= 0) {
        this.conversations[idx]!.lastMessage = msg
        const conv = this.conversations.splice(idx, 1)[0]!
        // если старый partner был UUID - обновить
        if (/^[0-9a-f-]{36}$/i.test(conv.partner.name) && this.selectedPartner?.id === partnerId) {
          conv.partner = { ...this.selectedPartner }
        }
        this.conversations.unshift(conv)
      } else {
        // нужен partner info - приоритет: selectedPartner > searchResults > conversations > fallback
        let partner: ChatUser | undefined
        if (this.selectedPartner?.id === partnerId) partner = { ...this.selectedPartner }
        else partner = this.searchResults.find(u => u.id === partnerId)
        if (!partner) partner = this.conversations.find(c => c.partner.id === partnerId)?.partner
        if (!partner) {
          partner = { id: partnerId, name: partnerId, email: partnerId, avatarUrl: null } as ChatUser
          // если имя - UUID, попробуем асинхронно подтянуть (не блокируем)
          this.searchUsers(partnerId).then(() => {
            const found = this.searchResults.find(u => u.id === partnerId)
            if (found) {
              const cIdx = this.conversations.findIndex(c => c.partner.id === partnerId)
              if (cIdx >= 0) this.conversations[cIdx]!.partner = found
              if (this.selectedPartner?.id === partnerId) this.selectedPartner = found
            }
          })
        }
        this.conversations.unshift({ partner, lastMessage: msg })
      }
      // также в мок сторадж для оффлайна
      const all = loadMockMessages()
      all.push({ ...msg, _mock: true })
      saveMockMessages(all)
      // если сообщение не от текущего открытого чата - увеличить счетчик + тост
      if (this.selectedPartner?.id !== partnerId) {
        this.unreadCount++
        // всплывающее уведомление с частью сообщения (на любой странице)
        try {
          const toast = useToast()
          const partner = this.searchResults.find(u => u.id === partnerId) ?? this.conversations.find(c => c.partner.id === partnerId)?.partner
          const name = partner ? (/^[0-9a-f-]{36}$/i.test(partner.name) ? partner.email : partner.name || partner.email) : ''
          const title = name ? `Новое сообщение от ${name}` : 'Новое сообщение'
          const description = msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text
          toast.add({ title, description, color: 'info' })
        } catch {}
      } else {
        // если чат открыт - сразу помечаем как прочитанное (бэкенд уже пометит, но для мока)
        msg.read = true
      }
    },
    clearSelected() {
      this.selectedPartner = null
    },
  },
})
