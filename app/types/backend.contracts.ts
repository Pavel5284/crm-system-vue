/**
 * Единый источник правды о HTTP-контрактах бэкенда (api-gateway).
 *
 * Зеркало ответов Nest-контроллеров из `apps/api-gateway/src/modules/*`.
 * Даты на проводе — ISO-строки (`JSON.stringify` превращает `Date` в `string`).
 *
 * Как синхронизировать: при изменении ответа бэкенда поменять тип здесь
 * 1-в-1 (имя + поля), `apiFetch<T, E>` подхватит новый тип автоматически.
 * Источник текстов ошибок — `throw new XException('...')` в `*.service.ts`
 * и `RpcException({ message })` в tasks/notifications сервисах.
 *
 * Все ответы с бэкенда идут через `TransformInterceptor`:
 * провод — `{ success: true, data: T }`, `apiFetch` разворачивает и
 * возвращает уже `T`. Здесь описаны именно `T` (внутренние `data`).
 * Исключение — 204 No Content (`POST /auth/logout`, `DELETE /comments/:id`,
 * `DELETE /tasks/:id`): тела нет, используйте `NoContent`
 * (`apiFetch<NoContent>` резолвится в `undefined`).
 */

export type NoContent = undefined

// ---------------------------------------------------------------------------
// Обертки провода (то, что реально летит по HTTP)
// ---------------------------------------------------------------------------

export interface SuccessResponse {
  success: boolean
}

export interface AuthTokens {
  accessToken: string
}

// ---------------------------------------------------------------------------
// Auth / Users
// ---------------------------------------------------------------------------

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
  isEmailVerified: boolean
  createdAt: string
}

export interface ProfileData extends AuthUser {
  position: string | null
  phone: string | null
  telegram: string | null
  updatedAt: string
}

export interface UpdateProfilePayload {
  name?: string
  position?: string | null
  phone?: string | null
  telegram?: string | null
}

export interface MeResponse {
  authenticated: boolean
}

export interface Visit {
  id: string
  userId?: string
  ip: string
  userAgent: string
  device: string | null
  browser: string | null
  os: string | null
  createdAt: string
}

export interface VisitsPaginated {
  data: Visit[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VisitsQuery {
  page?: number
  limit?: 10 | 25 | 50
}

// --- auth flow payloads -----------------------------------------------------

export type RegisterPendingMessage = 'Проверьте почту — мы отправили ссылку для подтверждения'

export interface RegisterPendingResponse {
  message: RegisterPendingMessage
}

export type RegisterResponse = AuthTokens | RegisterPendingResponse

export function isRegisterAutoLogin(res: RegisterResponse): res is AuthTokens {
  return typeof res === 'object' && res !== null && 'accessToken' in res
}

export type VerifyEmailSuccessMessage = 'Email успешно подтверждён' | 'Email уже подтверждён'

export interface VerifyEmailResponse {
  message: VerifyEmailSuccessMessage
}

export interface ResendVerificationResponse {
  message: 'Письмо отправлено повторно'
}

export type LoginResponse = AuthTokens
export type RefreshResponse = AuthTokens

// ---------------------------------------------------------------------------
// Customers / Deals / Comments
// ---------------------------------------------------------------------------

export interface CustomerDto {
  id: string
  name: string
  email: string
  avatarUrl: string
  fromSource: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCustomerPayload {
  name?: string
  email?: string
  fromSource?: string | null
}

export type DealStatus = 'todo' | 'to-be-agreed' | 'in-progress' | 'produced' | 'done'

export interface DealDto {
  id: string
  name: string
  price: number
  status: DealStatus
  customerId: string
  customerName: string
  customerEmail: string
  createdAt: string
  updatedAt: string
}

export interface CreateDealPayload {
  name: string
  price: number
  customerEmail: string
  customerName: string
  status: DealStatus
}

export interface CommentDto {
  id: string
  text: string
  dealId: string
  userId: string | null
  userName: string
  userEmail: string
  createdAt: string
}

export interface CreateCommentPayload {
  dealId: string
  text: string
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  position?: string | null
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  text: string
  read: boolean
  createdAt: string
}

export type ConversationPartner = Pick<ChatUser, 'id' | 'name' | 'email' | 'avatarUrl'>

export type ConversationLastMessage = Pick<
  ChatMessage,
  'id' | 'text' | 'senderId' | 'receiverId' | 'createdAt' | 'read'
>

export interface Conversation {
  partner: ConversationPartner
  lastMessage: ConversationLastMessage
}

export interface UnreadCount {
  count: number
}

export interface ChatMessagesQuery {
  limit?: number
  offset?: number
}

export interface SendMessagePayload {
  receiverId: string
  text: string
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface TaskDto {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  authorId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedTasks {
  items: TaskDto[]
  total: number
  page: number
  limit: number
  pageCount: number
}

export interface CreateTaskPayload {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  assigneeId?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  assigneeId?: string
  status?: TaskStatus
}

export interface TasksQuery {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  page?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_DUE_SOON'

export interface NotificationDto {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  read: boolean
  createdAt: string
}

/**
 * Realtime-событие `notification` из `NotificationsGateway`
 * (`apps/api-gateway/.../notifications.gateway.ts`): тот же DTO,
 * но без `read` — как эмитит `NotificationsService.notify`.
 */
export interface NotificationEvent {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  createdAt: string
}

// ---------------------------------------------------------------------------
// Тексты ошибок — 1-в-1 с бэкендом
// ---------------------------------------------------------------------------

export type AuthErrorMessage =
  | 'Пользователь с таким email уже существует'
  | 'Неверный email или пароль'
  | 'Email не подтверждён. Проверьте почту'
  | 'Токен не указан'
  | 'Неверный токен'
  | 'Срок действия токена истёк'
  | 'Пользователь не найден'
  | 'Email уже подтверждён'
  | 'Письмо уже отправлено недавно. Повторите через 5 минут'
  | 'Unauthorized'

export type CustomerErrorMessage =
  | `Клиент ${string} не найден`
  | `Клиент с email ${string} уже существует`

export type DealErrorMessage = `Сделка ${string} не найдена`

export type CommentErrorMessage =
  | `Сделка ${string} не найдена`
  | `Комментарий ${string} не найден`

export type ChatErrorMessage =
  | 'Нельзя писать самому себе'
  | 'Сообщение пустое'
  | 'Пользователь не найден'

export type TaskErrorMessage =
  | `Задача ${string} не найдена`
  | 'Недостаточно прав для изменения этой задачи'

export type NotificationErrorMessage = 'Уведомление не найдено'

export type ValidationErrorMessage = string

export type BackendKnownMessage =
  | AuthErrorMessage
  | CustomerErrorMessage
  | DealErrorMessage
  | CommentErrorMessage
  | ChatErrorMessage
  | TaskErrorMessage
  | NotificationErrorMessage

/** Эндпоинты без доменных ошибок: второй дженерик `apiFetch<T, never>`. */
export type NoDomainError = never

// --- auth -------------------------------------------------------------------
/** Ошибки конкретных эндпоинтов — используйте как 2-й дженерик `apiFetch<T, E>`. */
export type RegisterError = Extract<AuthErrorMessage, 'Пользователь с таким email уже существует'>
export type LoginError = Extract<AuthErrorMessage, 'Неверный email или пароль' | 'Email не подтверждён. Проверьте почту'>
export type VerifyEmailError = Extract<AuthErrorMessage, 'Токен не указан' | 'Неверный токен' | 'Срок действия токена истёк'>
export type ResendVerificationError = Extract<AuthErrorMessage, 'Пользователь не найден' | 'Email уже подтверждён' | 'Письмо уже отправлено недавно. Повторите через 5 минут'>
export type RefreshError = Extract<AuthErrorMessage, 'Unauthorized'>
export type LogoutError = NoDomainError
export type MeError = NoDomainError
export type ProfileError = NoDomainError
export type UpdateProfileError = NoDomainError
export type AvatarError = NoDomainError
export type VisitsError = NoDomainError
export type SearchUsersError = NoDomainError

// --- customers / deals / comments -------------------------------------------
export type GetCustomersError = NoDomainError
export type GetCustomerError = CustomerErrorMessage
export type UpdateCustomerError = CustomerErrorMessage
export type CustomerAvatarError = CustomerErrorMessage

export type GetDealsError = NoDomainError
export type CreateDealError = NoDomainError
export type UpdateDealError = DealErrorMessage

export type GetCommentsError = NoDomainError
export type CreateCommentError = Extract<CommentErrorMessage, `Сделка ${string} не найдена`>
export type DeleteCommentError = Extract<CommentErrorMessage, `Комментарий ${string} не найден`>

// --- chat -------------------------------------------------------------------
export type SearchChatError = NoDomainError
export type ConversationsError = NoDomainError
export type GetMessagesError = Extract<ChatErrorMessage, 'Нельзя писать самому себе' | 'Пользователь не найден'>
export type SendMessageError = ChatErrorMessage
export type UnreadCountError = NoDomainError

// --- tasks / notifications ---------------------------------------------------
export type GetTasksError = TaskErrorMessage
export type GetTaskError = TaskErrorMessage
export type CreateTaskError = NoDomainError
export type UpdateTaskError = TaskErrorMessage
export type DeleteTaskError = TaskErrorMessage

export type GetNotificationsError = NoDomainError
export type MarkNotificationReadError = NotificationErrorMessage
