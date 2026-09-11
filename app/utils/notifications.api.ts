import { apiFetch } from '~/utils/api'
import type {
  GetNotificationsError,
  MarkNotificationReadError,
  NotificationDto,
  NotificationErrorMessage,
} from '~/types/backend.contracts'

export type { NotificationDto, NotificationErrorMessage }

export const getNotificationsApi = () =>
  apiFetch<NotificationDto[], GetNotificationsError>('/notifications', { toast: false })

export const markNotificationReadApi = (id: string) =>
  apiFetch<NotificationDto, MarkNotificationReadError>(`/notifications/${id}/read`, {
    method: 'PATCH',
    toast: false,
  })
