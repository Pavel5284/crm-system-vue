import { io, type Socket } from "socket.io-client"
import type { ChatMessage, ChatReadEvent } from "~/types/backend.contracts"
import { isRecord } from "~/types/api.types"

const isConnected = ref(false)
const typingPartnerId = ref<string | null>(null)
let socket: Socket | null = null
let typingTimeout: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

interface ChatTypingPayload {
  senderId: string
  isTyping: boolean
}

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!isRecord(value)) return false
  return typeof value.id === "string"
    && typeof value.text === "string"
    && typeof value.senderId === "string"
    && typeof value.receiverId === "string"
}

const isChatReadEvent = (value: unknown): value is ChatReadEvent => {
  if (!isRecord(value)) return false
  return typeof value.readerId === "string" && typeof value.upToCreatedAt === "string"
}

const isTypingPayload = (value: unknown): value is ChatTypingPayload => {
  if (!isRecord(value)) return false
  return typeof value.senderId === "string" && typeof value.isTyping === "boolean"
}

export const useChatSocket = () => {
  const chatStore = useChatStore()
  const authStore = useAuthStore()

  const connect = (): void => {
    if (socket?.connected) return
    if (!authStore.isAuth) return
    const baseUrl = useApiBaseUrl()
    const origin = baseUrl.replace(/\/api\/?$/, "") || "http://localhost:3000"
    socket = io(`${origin}/chat`, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      timeout: 10_000,
    })
    socket.on("connect", () => { isConnected.value = true })
    socket.on("disconnect", () => { isConnected.value = false })
    socket.on("connect_error", () => { isConnected.value = false })
    socket.on("chat:message", (msg: unknown) => {
      if (isChatMessage(msg)) chatStore.receiveMessage(msg)
    })
    socket.on("chat:read", (data: unknown) => {
      if (isChatReadEvent(data)) chatStore.markAsReadByRecipient(data.readerId, data.upToCreatedAt)
    })
    socket.on("chat:typing", (data: unknown) => {
      if (!isTypingPayload(data)) return
      if (data.isTyping) {
        typingPartnerId.value = data.senderId
        if (typingTimeout) clearTimeout(typingTimeout)
        typingTimeout = setTimeout(() => (typingPartnerId.value = null), 3000)
      } else if (typingPartnerId.value === data.senderId) {
        typingPartnerId.value = null
      }
    })
    socket.on("error", () => { isConnected.value = false })
  }

  const disconnect = (): void => {
    socket?.disconnect()
    socket = null
    isConnected.value = false
  }

  const sendTyping = (receiverId: string, isTyping: boolean): void => {
    socket?.emit("chat:typing", { receiverId, isTyping })
  }

  if (!isInitialized) {
    isInitialized = true
    if (import.meta.client) {
      watch(() => authStore.isAuth, (v) => {
        if (v) connect()
        else disconnect()
      }, { immediate: true })
    }
  }

  onMounted(() => {
    if (authStore.isAuth) connect()
  })

  onBeforeUnmount(() => {
    // не рвать глобальный сокет при размонтировании одной страницы
  })

  return { isConnected: readonly(isConnected), typingPartnerId: readonly(typingPartnerId), connect, disconnect, sendTyping }
}
