/**
 * Зеркало backend-матрицы `DEAL_PERMISSIONS`
 * (`crm-system-backend/libs/shared/src/constants/deal-permissions.constants.ts`)
 * ТОЛЬКО для UX (скрытие недоступных действий).
 * Проверка обязана быть на бэкенде — здесь её нет.
 */
export const DEAL_CREATE_ROLES: readonly string[] = ["MANAGER", "ADMIN", "USER"]
export const DEAL_DELETE_ROLES: readonly string[] = ["ADMIN"]

export const canCreateDeal = (role: string | null | undefined): boolean =>
  !!role && DEAL_CREATE_ROLES.includes(role)

export const canDeleteDeal = (role: string | null | undefined): boolean =>
  !!role && DEAL_DELETE_ROLES.includes(role)
