/**
 * Зеркало backend-матрицы `DEAL_PERMISSIONS`
 * (`crm-system-backend/libs/shared/src/constants/deal-permissions.constants.ts`)
 * ТОЛЬКО для UX (скрытие недоступных действий).
 * Проверка обязана быть на бэкенде — здесь её нет.
 */
export const DEAL_CREATE_ROLES: readonly string[] = ["MANAGER", "ADMIN", "USER"]
export const DEAL_UPDATE_ROLES: readonly string[] = ["MANAGER", "ADMIN", "USER"]
export const DEAL_DELETE_ROLES: readonly string[] = ["ADMIN"]
// Главный комментарий сделки — админ, начальник (MANAGER) и legacy USER
// (по смыслу равен MANAGER, как и в остальных правах на сделки).
// Зеркало `@Roles(Role.ADMIN, Role.MANAGER, Role.USER)` на PATCH /deals/:id/main-comment.
export const MAIN_COMMENT_EDIT_ROLES: readonly string[] = ["ADMIN", "MANAGER", "USER"]

export const canCreateDeal = (role: string | null | undefined): boolean =>
  !!role && DEAL_CREATE_ROLES.includes(role)

export const canUpdateDeal = (role: string | null | undefined): boolean =>
  !!role && DEAL_UPDATE_ROLES.includes(role)

export const canEditMainComment = (role: string | null | undefined): boolean =>
  !!role && MAIN_COMMENT_EDIT_ROLES.includes(role)

export const canDeleteDeal = (role: string | null | undefined): boolean =>
  !!role && DEAL_DELETE_ROLES.includes(role)
