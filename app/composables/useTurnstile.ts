// Cloudflare Turnstile: явный рендер виджета, токен одноразовый.
// Без site key (dev) — no-op: render ничего не делает, token пустой.
export interface TurnstileWidgetApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidgetApi
  }
}

export const useTurnstile = () => {
  const siteKey = (useRuntimeConfig().public.turnstileSiteKey || '') as string

  useHead({
    script: siteKey
      ? [
          {
            src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
            async: true,
            defer: true,
          },
        ]
      : [],
  })

  const tokenRef = ref('')
  const containerRef = ref<HTMLDivElement | null>(null)

  let widgetId: string | null = null
  let poll: ReturnType<typeof setInterval> | null = null

  // Скрипт с CDN грузится асинхронно — ждем window.turnstile поллингом.
  const render = () => {
    if (!siteKey) return
    let attempts = 0
    const tryRender = () => {
      const api = window.turnstile
      const el = containerRef.value
      if (api && el && !widgetId) {
        widgetId = api.render(el, {
          sitekey: siteKey,
          callback: (token: string) => {
            tokenRef.value = token
          },
          'expired-callback': () => {
            tokenRef.value = ''
          },
          'error-callback': () => {
            tokenRef.value = ''
          },
        })
        return true
      }
      return false
    }
    if (!tryRender()) {
      poll = setInterval(() => {
        attempts += 1
        if (tryRender() || attempts > 50) {
          if (poll) clearInterval(poll)
          poll = null
        }
      }, 200)
    }
  }

  const reset = () => {
    tokenRef.value = ''
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    }
  }

  const destroy = () => {
    if (poll) clearInterval(poll)
    poll = null
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId)
      widgetId = null
    }
  }

  onUnmounted(destroy)

  return { siteKey, tokenRef, containerRef, render, reset, destroy }
}
