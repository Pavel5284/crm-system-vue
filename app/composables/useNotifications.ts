import { io, type Socket } from "socket.io-client"
import type { NotificationEvent } from "~/types/backend.contracts"
import { isRecord } from "~/types/api.types"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "unauthorized" | "error"

const status = ref<ConnectionStatus>("connecting")
const socketId = ref<string>("")
const notifications = ref<NotificationEvent[]>([])
const error = ref<string>("")
let socket: Socket | null = null
let isNotifInit = false

const isNotificationEvent = (value: unknown): value is NotificationEvent => {
  if (!isRecord(value)) return false
  return typeof value.id === "string"
    && typeof value.userId === "string"
    && typeof value.type === "string"
    && typeof value.createdAt === "string"
}

export const useNotifications = () => {
  const connect = (): void => {
    if (socket?.connected) return
    status.value = "connecting"
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
    })
    socket.on("notification", (notification: unknown) => {
      if (!isNotificationEvent(notification)) return
      notifications.value.unshift(notification)
      if (notifications.value.length > 100) notifications.value.length = 100
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
    socket = null
    status.value = "disconnected"
    socketId.value = ""
  }

  const clear = (): void => {
    notifications.value = []
  }

  if (!isNotifInit && import.meta.client) {
    isNotifInit = true
  }

  onUnmounted(disconnect)

  return { status: readonly(status), socketId: readonly(socketId), notifications: readonly(notifications), error: readonly(error), connect, disconnect, clear }
}
