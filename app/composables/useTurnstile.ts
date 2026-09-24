// Cloudflare Turnstile: явный рендер невидимого виджета, токен одноразовый.
// Без site key (dev) — no-op: render ничего не делает, execute реджектится.
// Флоу: виджет рендерится скрытым при монтировании, челлендж запускается
// только по execute() (после валидной формы) и возвращает Promise с токеном.
export type TurnstileSize = 'normal' | 'compact' | 'flexible' | 'invisible'

export interface TurnstileRenderOpts {
  size?: TurnstileSize
  onVerified?: (token: string) => void
  onError?: () => void
  onExpired?: () => void
}

export interface TurnstileWidgetApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string
      size?: TurnstileSize
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  execute: (widgetId?: string) => void
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

  // Ожидание готовности виджета (CDN-скрипт грузится асинхронно).
  let readyResolve: ((ok: boolean) => void) | null = null
  let readyPromise: Promise<boolean> | null = null
  const whenReady = (): Promise<boolean> => {
    if (widgetId) return Promise.resolve(true)
    if (!readyPromise) {
      readyPromise = new Promise((res) => {
        readyResolve = res
      })
    }
    return readyPromise
  }
  const settleReady = (ok: boolean) => {
    readyResolve?.(ok)
    readyResolve = null
  }

  // Один незавершенный execute: новый вызов отменяет предыдущий промис.
  let pendingVerify: {
    resolve: (token: string) => void
    reject: (e: Error) => void
  } | null = null
  const settlePending = (fn: (p: NonNullable<typeof pendingVerify>) => void) => {
    if (pendingVerify) {
      const p = pendingVerify
      pendingVerify = null
      fn(p)
    }
  }

  // Скрипт с CDN грузится асинхронно — ждем window.turnstile поллингом.
  const render = (opts: TurnstileRenderOpts = {}) => {
    if (!siteKey) return
    if (widgetId) return
    const { size = 'invisible', onVerified, onError, onExpired } = opts
    let attempts = 0
    const tryRender = () => {
      const api = window.turnstile
      const el = containerRef.value
      if (api && el && !widgetId) {
        widgetId = api.render(el, {
          sitekey: siteKey,
          size,
          callback: (token: string) => {
            tokenRef.value = token
            onVerified?.(token)
            settlePending((p) => p.resolve(token))
          },
          'expired-callback': () => {
            tokenRef.value = ''
            onExpired?.()
            settlePending((p) => p.reject(new Error('turnstile-expired')))
          },
          'error-callback': () => {
            tokenRef.value = ''
            onError?.()
            settlePending((p) => p.reject(new Error('turnstile-error')))
          },
        })
        settleReady(true)
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
          if (!widgetId) settleReady(false)
        }
      }, 200)
    }
  }

  // Запуск челленджа по требованию (после валидной формы).
  // Резолвится токеном, реджектится при ошибке/истечении/отсутствии виджета.
  const execute = async (): Promise<string> => {
    if (!siteKey) throw new Error('turnstile-disabled')
    const ok = await whenReady()
    if (!ok || !widgetId || !window.turnstile) throw new Error('turnstile-unavailable')
    return new Promise<string>((resolve, reject) => {
      settlePending((p) => p.reject(new Error('turnstile-superseded')))
      pendingVerify = { resolve, reject }
      window.turnstile?.execute(widgetId ?? undefined)
    })
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
    settleReady(false)
    settlePending((p) => p.reject(new Error('turnstile-destroyed')))
    if (widgetId && window.turnstile) {
      window.turnstile.remove(widgetId)
      widgetId = null
    }
  }

  onUnmounted(destroy)

  return { siteKey, tokenRef, containerRef, render, execute, reset, destroy }
}
