interface ApiResponse<T> {
    success: boolean
    data: T
}

type ApiFetchOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | string
    headers?: Record<string, string>
    body?: unknown
    auth?: boolean
    retry?: boolean
    query?: Record<string, string | number>
    signal?: AbortSignal
    // совместимость с NitroFetchOptions — остальные поля прокидываем как есть
    [key: string]: unknown
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

// миграция: подчистить остатки localStorage после перехода на httpOnly (legacy ключи)
if (typeof window !== 'undefined') {
    try {
        localStorage.removeItem('noname_access_token')
        localStorage.removeItem('noname_refresh_token')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
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
            ...(fetchOptions as Record<string, unknown>),
            baseURL: useApiBaseUrl(),
            body: fetchOptions.body as BodyInit | Record<string, unknown> | null | undefined,
            credentials: 'include' as RequestCredentials,
            headers: {
                ...fetchOptions.headers,
            },
        } as Parameters<typeof $fetch>[1])
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
    const err = error as { data?: { message?: unknown } }
    const message = err?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) {
        // Nest ValidationPipe: [{ property, constraints: { matches: '...' } }, ...]
        const parts = (message as unknown[]).map((m) => {
            if (typeof m === 'string') return m
            if (m && typeof m === 'object' && 'constraints' in (m as Record<string, unknown>)) {
                const c = (m as { constraints?: Record<string, string> }).constraints
                if (c) return Object.values(c).join('; ')
            }
            if (m && typeof m === 'object' && 'message' in (m as Record<string, unknown>)) {
                const mm = (m as { message?: string }).message
                if (typeof mm === 'string') return mm
            }
            try { return JSON.stringify(m) } catch { return String(m) }
        }).filter(Boolean)
        if (parts.length) return parts.join('; ')
    }
    if (message && typeof message === 'object' && 'message' in message && typeof (message as { message?: unknown }).message === 'string') {
        return (message as { message: string }).message
    }
    // fallback: statusText
    const statusMessage = (error as { statusMessage?: string })?.statusMessage
    if (statusMessage) return statusMessage
    return 'Не удалось выполнить запрос'
}
