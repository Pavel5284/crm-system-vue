// будим notifications-service из браузера перед первым запросом.
// короткие пинги через gateway не держат соединение, а прямой запрос к /health
// держит 15-60с и сервис успевает проснуться. ответ читать не надо, шлем no-cors.
const WAKE_TIMEOUT_MS = 45_000
const FALLBACK_BASE_URL = "https://crm-notifications-service.onrender.com"
// TODO: вынести в env для стейджа, сейчас захардкожен прод

let wakePromise: Promise<void> | null = null

export const useNotificationsBaseUrl = (): string => {
  try {
    const url = (useRuntimeConfig() as { public: { notificationsBaseUrl?: string } }).public.notificationsBaseUrl
    if (url) return url
  } catch {
    // вне nuxt контекста просто отдаем фолбэк
  }
  return FALLBACK_BASE_URL
}

const fetchHealthNoCors = (healthUrl: string, timeoutMs: number): Promise<void> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(healthUrl, { mode: "no-cors", credentials: "omit", signal: controller.signal })
    .then(() => undefined)
    // opaque ответ или abort - все равно выходим тихо, никогда не кидаем
    .catch(() => undefined)
    .finally(() => clearTimeout(timer))
}

// дергаем один раз за сессию, дальше no-op
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
