import { defineStore } from "pinia"
import type { ChatUser, ChatMessage, Conversation } from "~/utils/chat.api"
import { getConversationsApi, getMessagesApi, getUnreadCountApi, markMessagesReadApi, sendMessageApi, searchUsersApi } from "~/utils/chat.api"

// Страница истории: совпадает с дефолтом бэкенда (limit=50)
const MESSAGES_PAGE_LIMIT = 50

// Имя/почта вида UUID — не данные для показа, а заглушка
const isUuidLike = (s: string | null | undefined): boolean =>
  !!s && /^[0-9a-f-]{36}$/i.test(s.trim())

export const useChatStore = defineStore("chat", {
  state: () => ({
    conversations: [] as Conversation[],
    messagesByPartner: {} as Record<string, ChatMessage[]>,
    messagesHasMore: {} as Record<string, boolean>,
    // Позиции скролла по диалогам — восстановить при возврате на /chats
    messageScrollTops: {} as Record<string, number>,
    selectedPartner: null as ChatUser | null,
    searchResults: [] as ChatUser[],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingOlder: false,
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
    async fetchUnreadCount(): Promise<void> {
      try {
        const { count } = await getUnreadCountApi()
        this.unreadCount = count
      } catch {
        this.unreadCount = 0
      }
    },
    async searchUsers(q: string): Promise<void> {
      if (!q.trim()) {
        this.searchResults = []
        return
      }
      this.isSearching = true
      try {
        this.searchResults = await searchUsersApi(q)
      } catch {
        this.searchResults = []
      } finally {
        this.isSearching = false
      }
    },
    async loadConversations(): Promise<void> {
      this.isLoadingConversations = true
      try {
        this.conversations = await getConversationsApi()
        await this.fetchUnreadCount()
      } catch {
        this.conversations = []
        this.unreadCount = 0
      } finally {
        this.isLoadingConversations = false
      }
    },
    async loadMessages(partnerId: string): Promise<void> {
      this.isLoadingMessages = true
      try {
        const msgs = await getMessagesApi(partnerId, { limit: MESSAGES_PAGE_LIMIT })
        this.messagesByPartner[partnerId] = msgs
        // полная страница — возможно, выше есть ещё история
        this.messagesHasMore[partnerId] = msgs.length >= MESSAGES_PAGE_LIMIT
        await this.fetchUnreadCount()
      } catch {
        this.messagesByPartner[partnerId] = []
        this.messagesHasMore[partnerId] = false
      } finally {
        this.isLoadingMessages = false
      }
    },
    async loadOlderMessages(partnerId: string): Promise<void> {
      if (this.isLoadingOlder || this.isLoadingMessages) return
      if (this.messagesHasMore[partnerId] === false) return
      const current = this.messagesByPartner[partnerId] ?? []
      this.isLoadingOlder = true
      try {
        const older = await getMessagesApi(partnerId, {
          limit: MESSAGES_PAGE_LIMIT,
          offset: current.length,
        })
        const knownIds = new Set(current.map((m) => m.id))
        const fresh = older.filter((m) => !knownIds.has(m.id))
        this.messagesByPartner[partnerId] = [...fresh, ...current]
        this.messagesHasMore[partnerId] = older.length >= MESSAGES_PAGE_LIMIT
      } catch { void 0 } finally {
        this.isLoadingOlder = false
      }
    },
    async selectPartner(user: ChatUser): Promise<void> {
      this.selectedPartner = user
      await this.loadMessages(user.id)
    },
    async sendMessage(text: string): Promise<void> {
      if (!this.selectedPartner || !text.trim()) return
      const partnerId = this.selectedPartner.id
      this.isSending = true
      try {
        const msg = await sendMessageApi(partnerId, text.trim())
        if (!this.messagesByPartner[partnerId]) this.messagesByPartner[partnerId] = []
        if (this.messagesByPartner[partnerId].some((m) => m.id === msg.id)) {
          const idx = this.conversations.findIndex((c) => c.partner.id === partnerId)
          if (idx >= 0) {
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
        const idx = this.conversations.findIndex((c) => c.partner.id === partnerId)
        if (idx >= 0) {
          if (/^[0-9a-f-]{36}$/i.test(this.conversations[idx]!.partner.name)) {
            this.conversations[idx]!.partner = { ...this.selectedPartner }
          }
          this.conversations[idx]!.lastMessage = msg
          const conv = this.conversations.splice(idx, 1)[0]!
          this.conversations.unshift(conv)
        } else {
          this.conversations.unshift({ partner: this.selectedPartner, lastMessage: msg })
        }
      } finally {
        this.isSending = false
      }
    },
    receiveMessage(msg: ChatMessage): void {
      const auth = useAuthStore()
      const myId = auth.user.id || auth.user.email
      const partnerId = msg.senderId === myId ? msg.receiverId : msg.senderId
      if (!this.messagesByPartner[partnerId]) this.messagesByPartner[partnerId] = []
      if (this.messagesByPartner[partnerId].some((m) => m.id === msg.id)) return
      this.messagesByPartner[partnerId].push(msg)
      const idx = this.conversations.findIndex((c) => c.partner.id === partnerId)
      if (idx >= 0) {
        this.conversations[idx]!.lastMessage = msg
        const conv = this.conversations.splice(idx, 1)[0]!
        if (isUuidLike(conv.partner.name) && this.selectedPartner?.id === partnerId) {
          conv.partner = { ...this.selectedPartner }
        }
        this.conversations.unshift(conv)
      } else {
        const partner = this.lookupPartner(partnerId)
          ?? { id: partnerId, name: partnerId, email: partnerId, avatarUrl: null }
        this.conversations.unshift({ partner, lastMessage: msg })
      }
      // Диалог считается открытым, только если пользователь реально смотрит
      // /chats с этим собеседником: selectedPartner переживает уход со
      // страницы, поэтому одной сверки id недостаточно — иначе сообщение,
      // пришедшее после ухода, тихо помечалось прочитанным и бейдж не рос.
      const isViewing = this.selectedPartner?.id === partnerId
        && useRoute().path === '/chats'
      if (!isViewing) {
        void this.handleUnreadMessage(msg, partnerId)
      }
      // Диалог открыт: «прочитано» ставит только observer видимости
      // (chats.vue) — здесь сообщение остаётся непрочитанным до просмотра.
    },
    lookupPartner(partnerId: string): ChatUser | undefined {
      if (this.selectedPartner?.id === partnerId) return this.selectedPartner
      return this.searchResults.find((u) => u.id === partnerId)
        ?? this.conversations.find((c) => c.partner.id === partnerId)?.partner
    },
    async handleUnreadMessage(msg: ChatMessage, partnerId: string): Promise<void> {
      let partner = this.lookupPartner(partnerId)
      if (!partner || isUuidLike(partner.name)) {
        // Имени нет — сервер источник правды (там имя/email отправителя).
        // loadConversations заодно подтягивает точный unreadCount,
        // поэтому ++ здесь не делаем.
        try {
          await this.loadConversations()
        } catch { /* ignore */ }
        const fresh = this.lookupPartner(partnerId)
        if (fresh && !isUuidLike(fresh.name)) {
          partner = fresh
          // подменяем UUID-плейсхолдер реальными данными
          const cIdx = this.conversations.findIndex((c) => c.partner.id === partnerId)
          if (cIdx >= 0 && isUuidLike(this.conversations[cIdx]!.partner.name)) {
            this.conversations[cIdx]!.partner = { ...fresh }
          }
          if (this.selectedPartner?.id === partnerId && isUuidLike(this.selectedPartner.name)) {
            this.selectedPartner = { ...fresh }
          }
        }
      } else {
        this.unreadCount++
      }
      this.showNewMessageToast(msg, partner)
    },
    showNewMessageToast(msg: ChatMessage, partner: ChatUser | undefined): void {
      try {
        const toast = useToast()
        // UUID вместо имени/почты не показываем — лучше заголовок без имени
        const display = partner && !isUuidLike(partner.name)
          ? partner.name
          : partner && partner.email.includes('@') ? partner.email : ''
        // useI18n() вне setup-компонента бросает — берём t из инстанса,
        // иначе (как было) падал весь блок и тост не всплывал вообще.
        const nuxtApp = useNuxtApp() as unknown as { $i18n?: { t: (k: string, p?: Record<string, unknown>) => string } }
        const t = nuxtApp.$i18n?.t ?? ((k: string) => k)
        const title = display ? t('chats.newMessageFrom', { name: display }) : t('chats.newMessage')
        const description = msg.text.length > 80 ? msg.text.slice(0, 80) + '...' : msg.text
        toast.add({ title, description, color: 'info' })
      } catch { void 0 }
    },
    async markVisibleMessagesRead(partnerId: string, upToMessageId: string): Promise<void> {
      const msgs = this.messagesByPartner[partnerId] ?? []
      const target = msgs.find((m) => m.id === upToMessageId)
      if (!target) return
      try {
        await markMessagesReadApi(upToMessageId)
      } catch (e) {
        // Не глотаем молча: иначе рассинхрон фронта и сервера (например,
        // эндпоинта нет на серверном бэкенде) выглядит как «observer не работает»
        console.error('[chat] markVisibleMessagesRead failed:', e)
        return
      }
      // createdAt — ISO-строки одного формата, сравнение лексикографическое
      const upTo = target.createdAt
      const myId = useAuthStore().user.id
      for (const m of msgs) {
        if (!m.read && m.senderId !== myId && m.createdAt <= upTo) m.read = true
      }
      await this.fetchUnreadCount()
    },
    // Получатель прочитал: прилетело chat:read — переворачиваем галочки
    // у своих сообщений вплоть до увиденного. Счётчик не трогаем:
    // unread считает только входящие.
    markAsReadByRecipient(readerId: string, upToCreatedAt: string): void {
      const myId = useAuthStore().user.id
      const msgs = this.messagesByPartner[readerId] ?? []
      for (const m of msgs) {
        if (!m.read && m.senderId === myId && m.createdAt <= upToCreatedAt) m.read = true
      }
      const conv = this.conversations.find((c) => c.partner.id === readerId)
      const last = conv?.lastMessage
      if (last && !last.read && last.senderId === myId && last.createdAt <= upToCreatedAt) {
        last.read = true
      }
    },
    clearSelected(): void {
      this.selectedPartner = null
    },
  },
})
