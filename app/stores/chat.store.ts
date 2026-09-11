import { defineStore } from "pinia"
import type { ChatUser, ChatMessage, Conversation } from "~/utils/chat.api"
import { getConversationsApi, getMessagesApi, getUnreadCountApi, sendMessageApi, searchUsersApi } from "~/utils/chat.api"

export const useChatStore = defineStore("chat", {
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
        const msgs = await getMessagesApi(partnerId)
        this.messagesByPartner[partnerId] = msgs
        await this.fetchUnreadCount()
      } catch {
        this.messagesByPartner[partnerId] = []
      } finally {
        this.isLoadingMessages = false
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
        if (/^[0-9a-f-]{36}$/i.test(conv.partner.name) && this.selectedPartner?.id === partnerId) {
          conv.partner = { ...this.selectedPartner }
        }
        this.conversations.unshift(conv)
      } else {
        let partner: ChatUser | undefined
        if (this.selectedPartner?.id === partnerId) partner = { ...this.selectedPartner }
        else partner = this.searchResults.find((u) => u.id === partnerId)
        if (!partner) partner = this.conversations.find((c) => c.partner.id === partnerId)?.partner
        if (!partner) {
          partner = { id: partnerId, name: partnerId, email: partnerId, avatarUrl: null }
          this.searchUsers(partnerId).then(() => {
            const found = this.searchResults.find((u) => u.id === partnerId)
            if (found) {
              const cIdx = this.conversations.findIndex((c) => c.partner.id === partnerId)
              if (cIdx >= 0) this.conversations[cIdx]!.partner = found
              if (this.selectedPartner?.id === partnerId) this.selectedPartner = found
            }
          })
        }
        this.conversations.unshift({ partner, lastMessage: msg })
      }
      if (this.selectedPartner?.id !== partnerId) {
        this.unreadCount++
        try {
          const toast = useToast()
          const partner = this.searchResults.find((u) => u.id === partnerId) ?? this.conversations.find((c) => c.partner.id === partnerId)?.partner
          const name = partner ? (/^[0-9a-f-]{36}$/i.test(partner.name) ? partner.email : partner.name || partner.email) : ""
          const t = useI18n().t as (k: string, p?: Record<string, unknown>) => string
          const title = name ? t("chats.newMessageFrom", { name }) : t("chats.newMessage")
          const description = msg.text.length > 80 ? msg.text.slice(0, 80) + "..." : msg.text
          toast.add({ title, description, color: "info" })
        } catch { void 0 }
      } else {
        msg.read = true
      }
    },
    clearSelected(): void {
      this.selectedPartner = null
    },
  },
})
