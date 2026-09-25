import { io, type Socket } from "socket.io-client"
import type { NotificationDto, NotificationEvent } from "~/types/backend.contracts"
import { isRecord } from "~/types/api.types"
import { getNotificationsApi, markAllNotificationsReadApi, markNotificationReadApi } from "~/utils/notifications.api"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "unauthorized" | "error"

// Храним DTO с флагом read — зелёный индикатор горит только при read === false.
// WS-событие приходит без read → считаем его непрочитанным.
const status = ref<ConnectionStatus>("disconnected")
const socketId = ref<string>("")
const items = ref<NotificationDto[]>([])
const error = ref<string>("")
const isLoading = ref(false)
const isLoaded = ref(false)
let socket: Socket | null = null
let loadingPromise: Promise<void> | null = null

const unreadCount = computed(() => items.value.filter((n) => !n.read).length)
const hasUnread = computed(() => unreadCount.value > 0)

const isNotificationEvent = (value: unknown): value is NotificationEvent => {
  if (!isRecord(value)) return false
  return typeof value.id === "string"
    && typeof value.userId === "string"
    && typeof value.type === "string"
    && typeof value.createdAt === "string"
}

const upsertIncoming = (incoming: NotificationEvent): void => {
  const idx = items.value.findIndex((n) => n.id === incoming.id)
  const dto: NotificationDto = { ...incoming, payload: incoming.payload ?? {}, read: false }
  if (idx >= 0) {
    // Повторный пуш по тому же id не должен воскрешать прочитанное.
    if (!items.value[idx]!.read) items.value[idx] = dto
    return
  }
  items.value.unshift(dto)
  if (items.value.length > 100) items.value.length = 100
}

const fetchNotifications = async (force = false): Promise<void> => {
  if (isLoading.value && loadingPromise) {
    await loadingPromise
    return
  }
  if (isLoaded.value && !force) return
  isLoading.value = true
  loadingPromise = (async () => {
    try {
      const list = await getNotificationsApi()
      items.value = [...list]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 100)
      isLoaded.value = true
    } catch {
      // Тихо: дропдаун покажет пустое состояние, WS-пуши продолжат работать.
    } finally {
      isLoading.value = false
      loadingPromise = null
    }
  })()
  await loadingPromise
}

const markRead = async (id: string): Promise<void> => {
  const item = items.value.find((n) => n.id === id)
  if (!item || item.read) return
  item.read = true
  try {
    await markNotificationReadApi(id)
  } catch {
    item.read = false
  }
}

const markAllRead = async (): Promise<void> => {
  if (!unreadCount.value) return
  const prev = items.value.map((n) => n.read)
  items.value.forEach((n) => { n.read = true })
  try {
    await markAllNotificationsReadApi()
  } catch {
    // Фолбэк: bulk-эндпоинт недоступен (старый бэкенд) — помечаем по одному.
    try {
      const unread = items.value.filter((_, i) => !prev[i])
      await Promise.all(unread.map((n) => markNotificationReadApi(n.id)))
    } catch {
      items.value.forEach((n, i) => { n.read = prev[i] ?? false })
    }
  }
}

export const useNotifications = () => {
  const connect = (): void => {
    if (socket?.connected) {
      void fetchNotifications()
      return
    }
    status.value = "connecting"
    // REST-история — источник правды о прочитанных; WS — только live-пуши.
    void fetchNotifications()
    const baseUrl = useApiBaseUrl()
    const socketOrigin = baseUrl.replace(/\/api\/?$/, "") || "http://localhost:3000"
    socket = io(`${socketOrigin}/notifications`, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      timeout: 10_000,
    })
    socket.on("connect", () => {
      status.value = "connected"
      socketId.value = socket?.id ?? ""
      error.value = ""
      void fetchNotifications(true)
    })
    socket.on("notification", (notification: unknown) => {
      if (!isNotificationEvent(notification)) return
      upsertIncoming(notification)
    })
    socket.on("error", (msg: unknown) => {
      status.value = "unauthorized"
      error.value = String(msg)
    })
    socket.on("disconnect", (reason) => {
      status.value = reason === "io server disconnect" ? "disconnected" : "connecting"
      socketId.value = ""
      if (reason === "io server disconnect") error.value = "Отключен сервером"
    })
    socket.on("connect_error", (err: Error) => {
      status.value = "error"
      error.value = err.message
    })
  }

  const disconnect = (): void => {
    socket?.disconnect()
    socket?.removeAllListeners()
    socket = null
    status.value = "disconnected"
    socketId.value = ""
  }

  const clear = (): void => {
    items.value = []
    isLoaded.value = false
  }

  onUnmounted(disconnect)

  return {
    status: readonly(status),
    socketId: readonly(socketId),
    // Новое имя — источник правды; старое оставляем как алиас.
    items: readonly(items),
    notifications: readonly(items),
    unreadCount: readonly(unreadCount),
    hasUnread: readonly(hasUnread),
    isLoading: readonly(isLoading),
    error: readonly(error),
    connect,
    disconnect,
    clear,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
  }
}
