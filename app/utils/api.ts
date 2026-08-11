interface ApiResponse<T> {
    success: boolean
    data: T
}

interface ApiFetchOptions extends Omit<RequestInit, 'headers' | 'body'> {
    headers?: Record<string, string>
    body?: unknown
    auth?: boolean
}

const ACCESS_TOKEN_KEY = 'kilka_access_token'
const REFRESH_TOKEN_KEY = 'kilka_refresh_token'

export const useApiBaseUrl = () => {
    const config = useRuntimeConfig()
    return config.public.apiBaseUrl
}

export const setTokens = (tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export const hasTokens = () => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
}

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
            if (!refreshToken) return null
            try {
                const res = await $fetch<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
                    method: 'POST',
                    baseURL: useApiBaseUrl(),
                    body: { refreshToken },
                })
                setTokens(res.data)
                return res.data.accessToken
            } catch {
                clearTokens()
                return null
            } finally {
                refreshPromise = null
            }
        })()
    }
    return refreshPromise
}

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
    const { auth = true, ...fetchOptions } = options
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)

    const request = async (accessToken: string | null) => {
        const res = await $fetch<ApiResponse<T> | T>(path, {
            ...fetchOptions,
            baseURL: useApiBaseUrl(),
            body: fetchOptions.body,
            headers: {
                ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...fetchOptions.headers,
            },
        })
        return res && typeof res === 'object' && 'success' in res ? (res as ApiResponse<T>).data : (res as T)
    }

    try {
        return await request(token)
    } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (auth && statusCode === 401) {
            const newToken = await refreshAccessToken()
            if (newToken) return await request(newToken)
        }
        throw error
    }
}

export const getApiErrorMessage = (error: unknown): string => {
    const err = error as { data?: { message?: string | string[] | { message?: string } } }
    const message = err?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join('; ')
    if (message && typeof message === 'object' && 'message' in message && typeof message.message === 'string') {
        return message.message
    }
    return 'Не удалось выполнить запрос'
}
