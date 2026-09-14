import type { Component } from 'vue'

// Клиентский загрузчик федеративного модуля `customers/CustomersPage`.
// Вариант B: федерация живёт только на клиенте, host рендерится через SSR
// как обычно, remote монтируется внутри `<ClientOnly>`.
//
// Сознательное отклонение от черновика с `federation()` в `nuxt.config.ts`:
// Vite-плагин в хосте тянет URL ремоута в билд-тайм и дружит с Nuxt 4 + Vite 8
// хуже, чем runtime-загрузка. Поведение то же, но стабильнее SSR-сборка
// и URL можно менять без пересборки нюансов.

export const CUSTOMERS_REMOTE_NAME = 'customers'
export const CUSTOMERS_REMOTE_MODULE = 'customers/CustomersPage'

const LOAD_TIMEOUT_MS = 8000

type FederationInstance = {
  loadRemote: <T>(id: string) => Promise<T>
}

let instancePromise: Promise<FederationInstance> | null = null
let instanceEntry = ''

async function getInstance(entry: string): Promise<FederationInstance> {
  if (!instancePromise || instanceEntry !== entry) {
    instanceEntry = entry
    instancePromise = (async () => {
      const [{ createInstance }, vueModule] = await Promise.all([
        import('@module-federation/runtime'),
        import('vue'),
      ])
      return createInstance({
        name: 'host',
        remotes: [{ name: CUSTOMERS_REMOTE_NAME, entry }],
        shared: {
          // Правило №1: отдаём ремоуту инстанс Vue хоста (singleton),
          // иначе получим две копии Vue и баги реактивности на границе.
          vue: {
            version: vueModule.version,
            scope: 'default',
            singleton: true,
            get: () => vueModule,
          },
        },
      }) as unknown as FederationInstance
    })()
  }
  return instancePromise
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** Загружает компонент-remote. Бросает исключение — caller решает: фолбэк или экран ошибки. */
export async function loadCustomersRemote(entry: string): Promise<Component> {
  if (import.meta.server) throw new Error('mfe: remote is client-only')
  const mf = await withTimeout(getInstance(entry), LOAD_TIMEOUT_MS, 'mfe: runtime init timeout')
  const mod = await withTimeout(
    mf.loadRemote<{ default?: Component }>(CUSTOMERS_REMOTE_MODULE),
    LOAD_TIMEOUT_MS,
    'mfe: remote load timeout',
  )
  const component = mod?.default ?? (mod as unknown as Component)
  if (!component) throw new Error('mfe: empty remote module')
  return component
}
