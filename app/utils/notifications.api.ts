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
  // Gateway при спящем notifications-service ждёт пробуждения (poll /health
  // до 60с) и повторяет RPC — один запрос может идти до ~90с.
  apiFetch<NotificationDto[], GetNotificationsError>('/notifications', { toast: false, timeout: 100_000 })

export const markNotificationReadApi = (id: string) =>
  apiFetch<NotificationDto, MarkNotificationReadError>(`/notifications/${id}/read`, {
    method: 'PATCH',
    toast: false,
    timeout: 100_000,
  })

export const markAllNotificationsReadApi = () =>
  apiFetch<MarkAllNotificationsReadResponse, MarkAllNotificationsReadError>('/notifications/read-all', {
    method: 'PATCH',
    // Успех тихий (точка и так гаснет), а 504 на спящем free-плане показываем тостом.
    toast: { success: false },
    timeout: 100_000,
  })

export const deleteReadNotificationsApi = () =>
  apiFetch<DeleteReadNotificationsResponse, DeleteReadNotificationsError>('/notifications/read', {
    method: 'DELETE',
    toast: { success: false },
    timeout: 100_000,
  })
