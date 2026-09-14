/**
 * Контракт пилота `customers` (вариант B: клиентская федерация).
 *
 * Зеркалит подмножество `app/types/backend.contracts.ts` хоста:
 * при изменении ответа бэкенда править ОБА места 1-в-1
 * (источник текстов ошибок — Nest-контроллеры api-gateway).
 */

// --- DTO провода (внутри `data` оболочки `{ success: true, data: T }`) ---

export interface CustomerDto {
  id: string
  name: string
  email: string
  avatarUrl: string
  fromSource: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCustomerPayload {
  name?: string
  email?: string
  fromSource?: string | null
}

// --- Пропсы федеративного модуля `customers/CustomersPage` ---
//
// Remote сознательно самодостаточен: у него нет доступа к Nuxt-автоимпортам
// хоста (useI18n, useQuery, useAuthStore, @nuxt/ui), поэтому всё нужное
// для работы передаётся пропсами.

export type MfeLocale = 'ru' | 'en'

export interface CustomersPageProps {
  /** База API без слэша на конце, напр. `https://…/api`. Хост берёт из runtimeConfig.public.apiBaseUrl. */
  apiBaseUrl: string
  /** Локаль для подписей таблицы/слайдовера. Полный i18n остаётся в хосте. */
  locale?: MfeLocale
}

export const CUSTOMERS_REMOTE_NAME = 'customers' as const
export const CUSTOMERS_EXPOSED_MODULE = './CustomersPage' as const
export const CUSTOMERS_REMOTE_ID = `${CUSTOMERS_REMOTE_NAME}/${CUSTOMERS_EXPOSED_MODULE}` as const
