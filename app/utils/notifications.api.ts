import { apiFetch } from '~/utils/api'
import type {
  DeleteReadNotificationsError,
  DeleteReadNotificationsResponse,
  GetNotificationsError,
  MarkAllNotificationsReadError,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadError,
  NotificationDto,
  NotificationErrorMessage,
} from '~/types/backend.contracts'

export type { NotificationDto, NotificationErrorMessage }

export const getNotificationsApi = () =>
  apiFetch<NotificationDto[], GetNotificationsError>('/notifications', { toast: false, timeout: 20_000 })

export const markNotificationReadApi = (id: string) =>
  apiFetch<NotificationDto, MarkNotificationReadError>(`/notifications/${id}/read`, {
    method: 'PATCH',
    toast: false,
    timeout: 20_000,
  })

export const markAllNotificationsReadApi = () =>
  apiFetch<MarkAllNotificationsReadResponse, MarkAllNotificationsReadError>('/notifications/read-all', {
    method: 'PATCH',
    toast: false,
    timeout: 20_000,
  })

export const deleteReadNotificationsApi = () =>
  apiFetch<DeleteReadNotificationsResponse, DeleteReadNotificationsError>('/notifications/read', {
    method: 'DELETE',
    toast: false,
    timeout: 20_000,
  })
