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
    const e = error as Record<string, unknown>
    // $fetch FetchError может хранить в data / _data / response._data / cause
    const candidates: unknown[] = [
        (e as { data?: unknown })?.data,
        (e as { _data?: unknown })?._data,
        (e as { response?: { _data?: unknown } })?.response?._data,
        (e as { cause?: unknown })?.cause,
        e,
    ]
    for (const c of candidates) {
        if (!c || typeof c !== 'object') continue
        const msg = (c as { message?: unknown }).message ?? (c as { data?: unknown })?.data
        if (typeof msg === 'string' && msg && msg !== '[object Object]') return msg
        if (Array.isArray(msg)) {
            const parts = (msg as unknown[]).map((m) => {
                if (typeof m === 'string') return m
                if (m && typeof m === 'object') {
                    const o = m as Record<string, unknown>
                    if (o.constraints && typeof o.constraints === 'object') return Object.values(o.constraints as Record<string, string>).join('; ')
                    if (typeof o.message === 'string') return o.message
                    if (Array.isArray(o.issues)) return (o.issues as Array<{ message?: string }>).map(i=>i.message).filter(Boolean).join('; ')
                    try { const s = JSON.stringify(m); return s !== '{}' ? s : '' } catch { return '' }
                }
                return ''
            }).filter(Boolean)
            if (parts.length) return parts.join('; ')
        }
        if (msg && typeof msg === 'object') {
            const m = msg as Record<string, unknown>
            if (typeof m.message === 'string') return m.message
            if (Array.isArray(m.issues)) return (m.issues as Array<{ message?: string }>).map(i=>i.message).filter(Boolean).join('; ')
        }
    }
    const direct = (e as { message?: unknown })?.message
    if (typeof direct === 'string' && direct && direct !== '[object Object]') return direct
    const statusMessage = (e as { statusMessage?: unknown })?.statusMessage
    if (typeof statusMessage === 'string' && statusMessage) return statusMessage
    const statusText = (e as { statusText?: unknown })?.statusText
    if (typeof statusText === 'string' && statusText) return statusText
    return 'Не удалось выполнить запрос'
}
