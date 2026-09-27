// Прямое пробуждение notifications-service из браузера.
// Браузер будит спящий Render тем, что ДЕРЖИТ соединение 15–60с (доказано
// ручным открытием /health), а короткие пинги gateway — нет. Поэтому перед
// первым запросом истории сами держим patient-запрос к /health сервиса,
// и только потом идём в gateway — он попадает уже в тёплый сервис.
// mode: "no-cors": читать ответ не нужно (достаточно разбудить), поэтому
// CORS на notifications-service для этого не требуется.
// Никогда не бросает исключение: в худшем случае отработает wake gateway.
const WAKE_TIMEOUT_MS = 45_000
const FALLBACK_BASE_URL = "https://crm-notifications-service.onrender.com"

let wakePromise: Promise<void> | null = null

export const useNotificationsBaseUrl = (): string => {
  try {
    const url = (useRuntimeConfig() as { public: { notificationsBaseUrl?: string } }).public.notificationsBaseUrl
    if (url) return url
  } catch {
    // ignore — вне Nuxt-контекста ниже вернём фолбэк
  }
  return FALLBACK_BASE_URL
}

const fetchHealthNoCors = (healthUrl: string, timeoutMs: number): Promise<void> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(healthUrl, { mode: "no-cors", credentials: "omit", signal: controller.signal })
    .then(() => undefined)
    // opaque-ответ / сеть / abort после таймаута: будить больше некого
    // либо сервис уже гарантированно получил запрос — просто выходим
    .catch(() => undefined)
    .finally(() => clearTimeout(timer))
}

// Один раз за сессию: держим wake-соединение, повторные вызовы — no-op.
export const wakeNotificationsService = (): Promise<void> => {
  if (!import.meta.client) return Promise.resolve()
  if (!wakePromise) {
    wakePromise = (async () => {
      const baseUrl = useNotificationsBaseUrl().replace(/\/+$/, "")
      await fetchHealthNoCors(`${baseUrl}/health`, WAKE_TIMEOUT_MS)
    })()
  }
  return wakePromise
}
