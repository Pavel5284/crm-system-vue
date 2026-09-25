import type { NotificationDto, NotificationType } from '~/types/backend.contracts'

const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

/** dealId из payload — только уведомления со сделкой открывают слайовер. */
export const getNotificationDealId = (n: Pick<NotificationDto, 'payload'>): string | null =>
  str((n.payload as Record<string, unknown>)?.dealId)

/** taskId для задач (слайовер сделки не открывают — задел на будущее). */
export const getNotificationTaskId = (n: Pick<NotificationDto, 'payload'>): string | null =>
  str((n.payload as Record<string, unknown>)?.taskId)

export const isDealNotification = (n: Pick<NotificationDto, 'type' | 'payload'>): boolean =>
  getNotificationDealId(n) !== null

/** Ключ иконки lucide для типа (расширяемо: новый тип → новая ветка). */
export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'DEAL_ASSIGNED':
      return 'lucide:user-check'
    case 'DEAL_STAGE_CHANGED':
      return 'lucide:repeat'
    case 'DEAL_DEADLINE_SOON':
      return 'lucide:alarm-clock'
    case 'TASK_ASSIGNED':
      return 'lucide:list-todo'
    case 'TASK_DUE_SOON':
      return 'lucide:alarm-clock'
    case 'TASK_COMPLETED':
      return 'lucide:check-check'
    default:
      return 'lucide:bell'
  }
}

/** Заголовок уведомления (i18n-ключ + fallback). */
export const getNotificationTitleKey = (type: NotificationType): string => {
  switch (type) {
    case 'DEAL_ASSIGNED':
      return 'notifications.types.dealAssigned'
    case 'DEAL_STAGE_CHANGED':
      return 'notifications.types.dealStageChanged'
    case 'DEAL_DEADLINE_SOON':
      return 'notifications.types.dealDeadlineSoon'
    case 'TASK_ASSIGNED':
      return 'notifications.types.taskAssigned'
    case 'TASK_DUE_SOON':
      return 'notifications.types.taskDueSoon'
    case 'TASK_COMPLETED':
      return 'notifications.types.taskCompleted'
    default:
      return 'notifications.types.unknown'
  }
}

/** Подзаголовок: имя сделки/задачи из payload. */
export const getNotificationSubtitle = (n: NotificationDto): string => {
  const p = n.payload as Record<string, unknown>
  return str(p.name) ?? str(p.title) ?? ''
}

/** Детали: клиент / переход стадии / дедлайн — опционально по типу. */
export const getNotificationDetails = (n: NotificationDto): string | null => {
  const p = n.payload as Record<string, unknown>
  const parts: string[] = []
  const customer = str(p.customerName)
  if (customer) parts.push(customer)
  const from = str(p.fromStage)
  const to = str(p.toStage)
  if (from || to) parts.push(`${from ?? '?'} → ${to ?? '?'}`)
  const deadline = str(p.deadline)
  if (deadline) {
    try {
      parts.push(new Date(deadline).toLocaleDateString())
    } catch {
      parts.push(deadline)
    }
  }
  const comment = str(p.comment)
  if (comment) parts.push(comment)
  return parts.length ? parts.join(' · ') : null
}
