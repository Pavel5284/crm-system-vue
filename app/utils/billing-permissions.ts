/**
 * Зеркало backend-матриц `ORDER_PERMISSIONS` / `PAYMENT_PERMISSIONS`
 * (`crm-system-backend/libs/shared/src/constants/billing-permissions.constants.ts`)
 * ТОЛЬКО для UX (скрытие недоступных действий).
 * Проверка обязана быть на бэкенде — здесь её нет.
 */
export const ORDER_CREATE_ROLES: readonly string[] = ['MANAGER', 'ADMIN', 'USER']
export const ORDER_UPDATE_ROLES: readonly string[] = ['MANAGER', 'ADMIN', 'USER']
export const ORDER_DELETE_ROLES: readonly string[] = ['ADMIN']
export const ORDER_CANCEL_ROLES: readonly string[] = ['ADMIN']

export const PAYMENT_CREATE_ROLES: readonly string[] = ['MANAGER', 'ADMIN', 'USER']
export const PAYMENT_UPDATE_ROLES: readonly string[] = ['MANAGER', 'ADMIN', 'USER']
export const PAYMENT_REFUND_ROLES: readonly string[] = ['ADMIN', 'MANAGER']
export const PAYMENT_DELETE_ROLES: readonly string[] = ['ADMIN']

const includes = (roles: readonly string[], role: string | null | undefined): boolean =>
  !!role && roles.includes(role)

export const canCreateOrder = (role: string | null | undefined): boolean =>
  includes(ORDER_CREATE_ROLES, role)

export const canUpdateOrder = (role: string | null | undefined): boolean =>
  includes(ORDER_UPDATE_ROLES, role)

export const canDeleteOrder = (role: string | null | undefined): boolean =>
  includes(ORDER_DELETE_ROLES, role)

export const canCancelOrder = (role: string | null | undefined): boolean =>
  includes(ORDER_CANCEL_ROLES, role)

export const canCreatePayment = (role: string | null | undefined): boolean =>
  includes(PAYMENT_CREATE_ROLES, role)

export const canRefundPayment = (role: string | null | undefined): boolean =>
  includes(PAYMENT_REFUND_ROLES, role)

export const canDeletePayment = (role: string | null | undefined): boolean =>
  includes(PAYMENT_DELETE_ROLES, role)
