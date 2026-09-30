import type { OrderStatus, PaymentStatus } from '~/types/backend.contracts'

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
