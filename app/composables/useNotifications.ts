import { io, type Socket } from 'socket.io-client'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'unauthorized' | 'error'

export const useNotifications = () => {
    const status = ref<ConnectionStatus>('connecting')
    const socketId = ref<string>('')
    const notifications = ref<unknown[]>([])
    const error = ref<string>('')

    let socket: Socket | null = null

    const connect = () => {
        status.value = 'connecting'

        // httpOnly cookie отправляется автоматически (withCredentials).
        // Бэкенд также поддерживает auth.token как fallback, но он больше не нужен.
        const baseUrl = useRuntimeConfig().public.apiBaseUrl as string
        // apiBaseUrl = '/api' (через devProxy) или 'http://localhost:3000/api'
        // для сокета нужен origin без /api
        const socketOrigin = baseUrl.replace(/\/api\/?$/, '') || 'http://localhost:3000'

        socket = io(`${socketOrigin}/notifications`, {
            withCredentials: true,
            transports: ['websocket'],
        })

        socket.on('connect', () => {
            status.value = 'connected'
            socketId.value = socket?.id ?? ''
            error.value = ''
        })
        socket.on('notification', (notification: unknown) => {
            notifications.value.unshift(notification)
        })
        socket.on('error', (msg: unknown) => {
            status.value = 'unauthorized'
            error.value = String(msg)
        })
        socket.on('disconnect', (reason) => {
            status.value = reason === 'io server disconnect' ? 'disconnected' : 'connecting'
            socketId.value = ''
            if (reason === 'io server disconnect') error.value = 'Сервер отключил сокет'
        })
        socket.on('connect_error', (err) => {
            status.value = 'error'
            error.value = err.message
        })
    }

    const disconnect = () => {
        socket?.disconnect()
        socket = null
        status.value = 'disconnected'
        socketId.value = ''
    }

    const clear = () => {
        notifications.value = []
    }

    onUnmounted(disconnect)

    return { status, socketId, notifications, error, connect, disconnect, clear }
}
