import { io, type Socket } from 'socket.io-client'

const isConnected = ref(false)
const typingPartnerId = ref<string | null>(null)
let socket: Socket | null = null
let typingTimeout: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

export const useChatSocket = () => {
  const chatStore = useChatStore()
  const authStore = useAuthStore()

  const connect = () => {
    if (socket?.connected) return
    if (!authStore.isAuth) return

    const baseUrl = useRuntimeConfig().public.apiBaseUrl as string
    const origin = baseUrl.replace(/\/api\/?$/, '') || 'http://localhost:3000'

    socket = io(`${origin}/chat`, {
      withCredentials: true,
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      isConnected.value = true
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('connect_error', () => {
      isConnected.value = false
    })

    socket.on('chat:message', (msg: unknown) => {
      // бэкенд шлет DirectMessage
      const m = msg as { senderId: string; receiverId: string; text: string; id: string; createdAt: string; read: boolean }
      if (m && m.id && m.text) {
        chatStore.receiveMessage(m as never)
      }
    })

    socket.on('chat:typing', (data: { senderId: string; isTyping: boolean }) => {
      if (data?.isTyping) {
        typingPartnerId.value = data.senderId
        if (typingTimeout) clearTimeout(typingTimeout)
        typingTimeout = setTimeout(() => (typingPartnerId.value = null), 3000)
      } else {
        if (typingPartnerId.value === data?.senderId) typingPartnerId.value = null
      }
    })

    socket.on('error', () => {
      isConnected.value = false
    })
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
    isConnected.value = false
  }

  const sendTyping = (receiverId: string, isTyping: boolean) => {
    socket?.emit('chat:typing', { receiverId, isTyping })
  }

  // инициализируем вотчеры только один раз (синглтон)
  if (!isInitialized) {
    isInitialized = true
    // коннект при монтировании любого потребителя (default.vue уже mounted)
    if (import.meta.client) {
      watch(() => authStore.isAuth, (v) => {
        if (v) connect()
        else disconnect()
      }, { immediate: true })
    }
  }

  // для совместимости с предыдущим API - onMounted коннект (идемпотентно)
  onMounted(() => {
    if (authStore.isAuth) connect()
  })

  return { isConnected, typingPartnerId, connect, disconnect, sendTyping }
}
