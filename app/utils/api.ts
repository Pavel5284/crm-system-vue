interface ApiResponse<T> {
    success: boolean
    data: T
}

interface ApiFetchOptions extends Omit<RequestInit, 'headers' | 'body'> {
    headers?: Record<string, string>
    body?: unknown
    auth?: boolean
    retry?: boolean
    query?: Record<string, string | number>
}

export const useApiBaseUrl = () => {
    const config = useRuntimeConfig()
    return config.public.apiBaseUrl
}

// --- deprecated stubs: оставлены для совместимости, httpOnly куки нельзя читать из JS ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setTokens = (_tokens: { accessToken: string; refreshToken: string }) => {}
export const hasTokens = () => false
export const clearTokens = () => {}

// миграция: подчистить остатки localStorage после перехода на httpOnly
if (typeof window !== 'undefined') {
    try {
        localStorage.removeItem('kilka_access_token')
        localStorage.removeItem('kilka_refresh_token')
    } catch {}
}

let refreshPromise: Promise<boolean | null> | null = null

const refreshAccessToken = async (): Promise<boolean | null> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                await $fetch<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
                    method: 'POST',
                    baseURL: useApiBaseUrl(),
                    credentials: 'include' as RequestCredentials,
                })
                return true
            } catch {
                return null
            } finally {
                refreshPromise = null
            }
        })()
    }
    return refreshPromise
}

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
    const { auth = true, retry = true, ...fetchOptions } = options

    const request = async () => {
        const res = await $fetch<ApiResponse<T> | T>(path, {
            ...fetchOptions,
            baseURL: useApiBaseUrl(),
            body: fetchOptions.body as BodyInit | Record<string, unknown> | null | undefined,
            credentials: 'include' as RequestCredentials,
            headers: {
                ...fetchOptions.headers,
            },
        })
        return res && typeof res === 'object' && 'success' in res ? (res as ApiResponse<T>).data : (res as T)
    }

    try {
        return await request()
    } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        // не ретраим сам /auth/refresh чтобы не зациклить, и уважаем retry=false для гостевых проб (первый заход без кук)
        const isRefreshPath = path.includes('/auth/refresh')
        if (auth && retry && !isRefreshPath && statusCode === 401) {
            const ok = await refreshAccessToken()
            if (ok) return await request()
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
