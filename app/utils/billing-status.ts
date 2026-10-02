import type {
  OrderItemInput,
  OrderStatus,
  PaymentStatus,
} from '~/types/backend.contracts'

// классы бейджей, стили лежат в tailwind.css
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

// единицы как лежат в базе, старые строки показываем как есть
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

// черновик строки в редакторе
export interface ItemDraft {
  key: number
  name: string
  quantity: number
  price: number
  unitSelect: string
  unitCustom: string
}

// без названия - не отправляем
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
