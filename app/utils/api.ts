import {
  ApiError,
  getStatusCode,
  isBackendErrorResponse,
  isRecord,
  isSuccessResponse,
  type ApiSuccessResponse,
  type BackendErrorResponse,
} from "~/types/api.types"
import { humanizeDealError } from "~/utils/deal-move-error"

export { ApiError }

export type ToastOptions = false | {
  success?: string | false
  error?: string | false
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | string
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
  retry?: boolean
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  toast?: ToastOptions
  [key: string]: unknown
}

const SUCCESS_TOAST_MAP: Record<string, string> = {
  "PATCH /users/updateUserData": "api.profileUpdated",
  "POST /users/profile/avatar": "api.avatarUpdated",
  "DELETE /users/profile/avatar": "api.avatarRemoved",
}

// Мутации без success-тоста: auth-флоу (своя UX-логика/редиректы) и отправка
// сообщений в чат (сообщение и так видно в диалоге — тост был бы спамом).
// Ошибки для этих путей по-прежнему показывают error-тост.
const SILENT_SUCCESS_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/chat/messages",
]

const getSuccessMessageForRequest = (path: string, method?: string): string | null => {
  const keyWithMethod = `${method ?? "GET"} ${path}`
  if (SUCCESS_TOAST_MAP[keyWithMethod]) return SUCCESS_TOAST_MAP[keyWithMethod]
  if (SUCCESS_TOAST_MAP[path]) return SUCCESS_TOAST_MAP[path]
  for (const [k, v] of Object.entries(SUCCESS_TOAST_MAP)) {
    if (path.includes(k) || keyWithMethod.includes(k)) return v
  }
  return null
}

const getI18nT = (): ((key: string) => string) => {
  // useI18n — только внутри setup; снаружи (обработчики событий, apiFetch)
  // берём глобальный инстанс i18n (с bind — иначе t теряет контекст).
  try {
    const { t } = useI18n()
    return t as (key: string) => string
  } catch {
    // ignore — пробуем глобальный инстанс ниже
  }
  try {
    const nuxtApp = useNuxtApp() as unknown as { $i18n?: { t: (k: string) => string } }
    const t = nuxtApp.$i18n?.t
    if (typeof t === 'function') return t.bind(nuxtApp.$i18n)
  } catch {
    // ignore
  }
  return (k: string) => k
}

export type ApiToast = Pick<ReturnType<typeof useToast>, 'add'>

let cachedToast: ApiToast | null = null

// Захват инстанса вызывается один раз из app.vue (внутри setup).
export const setApiToast = (toast: ApiToast | null): void => {
  cachedToast = toast
}

const getToast = (): ApiToast | null => {
  if (cachedToast) return cachedToast
  // useToast() внутри вызывает inject(toastMaxInjectionKey): когда нет
  // активного инстанса (async-продолжения apiFetch, обработчики, сокеты),
  // Vue варнит "inject() can only be used inside setup()" на каждый вызов,
  // хотя тост за счет useState все равно срабатывает. Поэтому вне setup —
  // только кеш, useToast() здесь не вызываем.
  if (!getCurrentInstance()) return null
  try {
    const toast = useToast()
    if (import.meta.client) cachedToast = toast
    return toast
  } catch {
    return null
  }
}

export const useApiBaseUrl = (): string => {
  try {
    return (useRuntimeConfig() as { public: { apiBaseUrl: string } }).public.apiBaseUrl || "https://crm-api-gateway-zyrg.onrender.com/api"
  } catch {
    try {
      return (useNuxtApp() as unknown as { $config: { public: { apiBaseUrl: string } } }).$config.public.apiBaseUrl || "https://crm-api-gateway-zyrg.onrender.com/api"
    } catch {
      return "https://crm-api-gateway-zyrg.onrender.com/api"
    }
  }
}

// deprecated stubs: токены в httpOnly cookie, в JS не доступны
export const setTokens = (_tokens: { accessToken: string; refreshToken: string }): void => {}
export const hasTokens = (): boolean => false
export const clearTokens = (): void => {}

// Очистка legacy localStorage ключей (httpOnly миграция)
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("noname_access_token")
    localStorage.removeItem("noname_refresh_token")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  } catch { void 0 }
}

let refreshPromise: Promise<boolean | null> | null = null

const refreshAccessToken = async (): Promise<boolean | null> => {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      await $fetch<ApiSuccessResponse<{ accessToken: string }>>("/auth/refresh", {
        method: "POST",
        baseURL: useApiBaseUrl(),
        credentials: "include" as RequestCredentials,
      })
      return true
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export const apiFetch = async <T, TError extends string = string>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { auth = true, retry = true, toast: toastOpt, ...fetchOptions } = options

  const request = async (): Promise<T> => {
    const baseURL = useApiBaseUrl()
    // на сервере пробрасываем cookie входящего запроса (иначе httpOnly auth не уйдет)
    const serverHeaders: Record<string, string> = {}
    if (import.meta.server) {
      try {
        const h = useRequestHeaders(["cookie"])
        if (h.cookie) serverHeaders.cookie = h.cookie
      } catch { void 0 }
    }
    const res: unknown = await $fetch(path, {
      ...(fetchOptions as Record<string, unknown>),
      baseURL,
      body: fetchOptions.body as BodyInit | Record<string, unknown> | null | undefined,
      credentials: "include" as RequestCredentials,
      headers: {
        ...serverHeaders,
        ...fetchOptions.headers,
      },
    } as Parameters<typeof $fetch>[1])
    // 204 No Content (logout, delete comment/task): тела нет — резолвим в undefined
    if (res === null || res === undefined || res === "") return undefined as T
    if (isSuccessResponse<T>(res)) return res.data
    if (isRecord(res) && "success" in res) return undefined as T
    return res as T
  }

  const toApiError = (error: unknown): ApiError<TError> => {
    const envelope = extractErrorEnvelope<TError>(error)
    return new ApiError<TError>(getApiErrorMessage(error), {
      statusCode: getStatusCode(error),
      envelope,
    })
  }

  const showSuccessToast = (method?: string): void => {
    if (toastOpt === false) return
    if (typeof toastOpt === "object" && toastOpt.success === false) return
    const toast = getToast()
    if (!toast) return
    if (typeof toastOpt === "object" && typeof toastOpt.success === "string") {
      toast.add({ title: toastOpt.success, color: "success" })
      return
    }
    const autoMsg = getSuccessMessageForRequest(path, method ?? (fetchOptions.method as string))
    if (autoMsg) {
      if (autoMsg === "api.profileUpdated") {
        toast.add({ title: getI18nT()("api.save"), description: getI18nT()("api.profileUpdated"), color: "success" })
      } else {
        toast.add({ title: getI18nT()(autoMsg), color: "success" })
      }
      return
    }
    // Дефолт: любая мутация (POST/PATCH/PUT/DELETE) показывает тост «Сохранено».
    // Технические/фоновые запросы — в исключениях ниже.
    const effectiveMethod = (method ?? (fetchOptions.method as string) ?? "GET").toUpperCase()
    const isMutation = effectiveMethod === "POST" || effectiveMethod === "PATCH"
      || effectiveMethod === "PUT" || effectiveMethod === "DELETE"
    if (!isMutation) return
    if (SILENT_SUCCESS_PATHS.some((p) => path.includes(p))) return
    toast.add({ title: getI18nT()("api.saved"), color: "success" })
  }

  const showErrorToast = (error: unknown): void => {
    if (toastOpt === false) return
    if (typeof toastOpt === "object" && toastOpt.error === false) return
    const statusCode = (error as { statusCode?: number })?.statusCode
    const isAuthCheck = path.includes("/users/me") || path.includes("/auth/refresh") || path.includes("/users/profile")
    const isSilentAuthError = statusCode === 401 && isAuthCheck
    if (isSilentAuthError) return
    const toast = getToast()
    if (!toast) return
    if (typeof toastOpt === "object" && typeof toastOpt.error === "string") {
      toast.add({ title: getI18nT()("api.error"), description: toastOpt.error, color: "error" })
      return
    }
    const msg = humanizeDealError(getApiErrorMessage(error), getI18nT())
    toast.add({ title: getI18nT()("api.error"), description: msg, color: "error" })
  }

  try {
    const data = await request()
    showSuccessToast(fetchOptions.method as string)
    return data
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    const isRefreshPath = path.includes("/auth/refresh")
    if (auth && retry && !isRefreshPath && statusCode === 401) {
      const ok = await refreshAccessToken()
      if (ok) {
        try {
          const data = await request()
          showSuccessToast(fetchOptions.method as string)
          return data
        } catch (retryError) {
          const apiError = toApiError(retryError)
          showErrorToast(apiError)
          throw apiError
        }
      }
    }
    const apiError = toApiError(error)
    showErrorToast(apiError)
    throw apiError
  }
}

const extractErrorEnvelope = <TMessage extends string = string>(error: unknown): BackendErrorResponse<TMessage> | null => {
  const e = error as Record<string, unknown>
  const candidates: unknown[] = [
    (e as { data?: unknown })?.data,
    (e as { _data?: unknown })?._data,
    (e as { response?: { _data?: unknown } })?.response?._data,
    (e as { cause?: unknown })?.cause,
    e,
  ]
  for (const c of candidates) {
    if (isBackendErrorResponse<TMessage>(c)) return c
  }
  return null
}

export const getApiErrorMessage = (error: unknown): string => {
  const e = error as Record<string, unknown>
  const candidates: unknown[] = [
    (e as { data?: unknown })?.data,
    (e as { _data?: unknown })?._data,
    (e as { response?: { _data?: unknown } })?.response?._data,
    (e as { cause?: unknown })?.cause,
    e,
  ]
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue
    const msg = (c as { message?: unknown }).message ?? (c as { data?: unknown })?.data
    if (typeof msg === "string" && msg && msg !== "[object Object]") return msg
    if (Array.isArray(msg)) {
      const parts = (msg as unknown[]).map((m) => {
        if (typeof m === "string") return m
        if (m && typeof m === "object") {
          const o = m as Record<string, unknown>
          if (o.constraints && typeof o.constraints === "object") return Object.values(o.constraints as Record<string, string>).join("; ")
          if (typeof o.message === "string") return o.message
          if (Array.isArray(o.issues)) return (o.issues as Array<{ message?: string }>).map(i => i.message).filter(Boolean).join("; ")
          try {
            const s = JSON.stringify(m)
            return s !== "{}" ? s : ""
          } catch {
            return ""
          }
        }
        return ""
      }).filter(Boolean)
      if (parts.length) return parts.join("; ")
    }
    if (msg && typeof msg === "object") {
      const m = msg as Record<string, unknown>
      if (typeof m.message === "string") return m.message
      if (Array.isArray(m.issues)) return (m.issues as Array<{ message?: string }>).map(i => i.message).filter(Boolean).join("; ")
    }
  }
  const direct = (e as { message?: unknown })?.message
  if (typeof direct === "string" && direct && direct !== "[object Object]") return direct
  const statusMessage = (e as { statusMessage?: unknown })?.statusMessage
  if (typeof statusMessage === "string" && statusMessage) return statusMessage
  const statusText = (e as { statusText?: unknown })?.statusText
  if (typeof statusText === "string" && statusText) return statusText
  return "Произошла ошибка"
}
