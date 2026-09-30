import type {
  OrderItemInput,
  OrderStatus,
  PaymentStatus,
} from '~/types/backend.contracts'

/**
 * CSS-классы бейджей статусов биллинга (стили — глобально,
 * в `app/assets/css/tailwind.css`, слой `components`).
 * Единая точка вместо трёх копий `statusClass` по компонентам.
 */
export const orderBadgeClass = (status: OrderStatus | string): string => {
  switch (status) {
    case 'PAID':
      return 'badge badge-ok'
    case 'PARTIALLY_PAID':
      return 'badge badge-warn'
    case 'CANCELLED':
      return 'badge badge-bad'
    case 'REFUNDED':
      return 'badge badge-info'
    default:
      return 'badge badge-neutral'
  }
}

export const paymentBadgeClass = (status: PaymentStatus | string): string => {
  switch (status) {
    case 'SUCCEEDED':
      return 'badge badge-ok'
    case 'PENDING':
      return 'badge badge-warn'
    case 'FAILED':
    case 'CANCELLED':
      return 'badge badge-bad'
    case 'REFUNDED':
      return 'badge badge-info'
    default:
      return 'badge badge-neutral'
  }
}

// Коды единиц измерения позиций (хранятся в БД как есть, отображаются
// через `orders.units.*` с фолбэком на сырое значение для старых строк).
export const UNIT_CODES = [
  'PCS',
  'KG',
  'G',
  'T',
  'M',
  'CM',
  'L',
  'ML',
  'PACK',
  'SET',
  'HOUR',
] as const

export const CUSTOM_UNIT = '__custom'

// Черновик позиции в редакторе (диалог создания + правка заказа).
export interface ItemDraft {
  key: number
  name: string
  quantity: number
  price: number
  unitSelect: string
  unitCustom: string
}

// Строки без названия — черновики, в payload не идут.
export function toOrderItemPayload(rows: ItemDraft[]): OrderItemInput[] {
  return rows
    .filter((row) => row.name.trim())
    .map((row) => ({
      name: row.name.trim(),
      quantity: Number(row.quantity),
      ...(row.unitSelect === CUSTOM_UNIT
        ? row.unitCustom.trim()
          ? { unit: row.unitCustom.trim() }
          : {}
        : row.unitSelect
          ? { unit: row.unitSelect }
          : {}),
      price: Number(row.price),
    }))
}
