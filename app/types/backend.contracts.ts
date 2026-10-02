// контракты gateway, зеркало ответов нести. даты - ISO строки.
// если бэк поменял ответ - правим тут 1в1, apiFetch подхватит сам.
// все ответы идут через { success: true, data }, apiFetch разворачивает в data.
// кроме 204 (logout, удаление) - там тела нет.

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

export type UserRole = 'USER' | 'ADMIN' | 'MANAGER' | 'TECHNOLOGIST' | 'LOGIST'

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
  phone: string | null
  contactPerson: string | null
  avatarUrl: string
  fromSource: string | null
  createdAt: string
  updatedAt: string
  /** Только в GET /customers: кол-во сделок */
  dealsCount?: number
}

export interface UpdateCustomerPayload {
  name?: string
  email?: string
  phone?: string | null
  contactPerson?: string | null
  fromSource?: string | null
}

export type DealStatus = 'todo' | 'to-be-agreed' | 'in-progress' | 'produced' | 'done'

/** клиент сделки, джойн по customerId */
export interface DealCustomerRef {
  id: string
  name: string
  email: string
  phone: string | null
  contactPerson: string | null
  fromSource: string | null
}

export interface DealDto {
  id: string
  name: string
  description: string
  mainComment: string | null
  price: number
  status: DealStatus
  customerId: string
  customer: DealCustomerRef
  responsibleUserId: string | null
  deadline: string | null
  priority: string
  isImported: boolean
  importedBy: string | null
  responsibleName: string | null
  createdAt: string
  updatedAt: string
}

export interface NewCustomerPayload {
  name: string
  email: string
  phone?: string
  contactPerson?: string
  fromSource?: string
}

export interface CreateDealPayload {
  name: string
  description: string
  price: number
  customerId?: string
  newCustomer?: NewCustomerPayload
  responsibleUserId: string
  deadline?: string
  priority?: string
}

export interface ImportDealPayload extends CreateDealPayload {
  status: DealStatus
  isImported: true
  importedBy: string
}

export interface DealUserRef {
  id: string
  name: string
  email: string
}

export interface DealItemDto {
  id: string
  dealId: string
  name: string
  quantity: number
  unit: string | null
  spec: string | null
  createdAt: string
  updatedAt: string
}

export interface DealStageHistoryDto {
  id: string
  dealId: string
  fromStage: string | null
  toStage: string
  changedByUserId: string | null
  changedBy: DealUserRef | null
  comment: string | null
  createdAt: string
}

export interface DealAttachmentDto {
  id: string
  dealId: string
  fileUrl: string
  uploadedBy: string | null
  uploader: DealUserRef | null
  createdAt: string
}

export interface DealDetailsDto extends DealDto {
  responsible: DealUserRef | null
  responsibles: DealUserRef[]
  items: DealItemDto[]
  stageHistory: DealStageHistoryDto[]
  attachments: DealAttachmentDto[]
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
  unreadCount: number
}

export interface UnreadCount {
  count: number
}

export interface UnreadDialogs {
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

export interface ChatReadEvent {
  readerId: string
  upToCreatedAt: string
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

// типы уведомлений, новый тип = новая ветка в notifications.presentation
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_DUE_SOON'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_DEADLINE_SOON'
  | 'DEAL_ASSIGNED'

/** со сделкой - открывают слайовер по клику */
export type DealNotificationType =
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_DEADLINE_SOON'
  | 'DEAL_ASSIGNED'

/** по задачам, слайовер не открывают */
export type TaskNotificationType = 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_DUE_SOON'

export interface TaskNotificationPayload {
  taskId: string
  title: string
}

export interface DealNotificationPayload {
  dealId: string
  name: string
  customerName?: string
  fromStage?: string
  toStage?: string
  status?: string
  deadline?: string | null
  comment?: string | null
  title?: string
}

export type NotificationPayload = TaskNotificationPayload | DealNotificationPayload | Record<string, unknown>

export interface NotificationDto {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  read: boolean
  createdAt: string
}

/**
 * realtime `notification` из gateway, тоже самое но без read
 */
export interface NotificationEvent {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  createdAt: string
}

// ---------------------------------------------------------------------------
// Orders / Payments (billing)
// ---------------------------------------------------------------------------

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'SBP' | 'OTHER'

export interface OrderListDto {
  id: string
  number: number
  dealId: string | null
  dealName: string | null
  customerId: string
  customerName: string
  total: number
  paid: number
  remaining: number
  status: OrderStatus
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItemInput {
  name: string
  quantity: number
  unit?: string
  price: number
  spec?: string
}

export interface CreateOrderPayload {
  dealId?: string
  customerId?: string
  total?: number
  comment?: string
  items?: OrderItemInput[]
}

export interface UpdateOrderPayload {
  comment?: string
  total?: number
  items?: OrderItemInput[]
}

export interface ChangeOrderStatusPayload {
  status: OrderStatus
  comment?: string
}

export interface OrderItemDto {
  id: string
  orderId: string
  name: string
  quantity: number
  unit: string | null
  price: number
  lineTotal: number
  spec: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderStatusHistoryDto {
  id: string
  orderId: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedByUserId: string | null
  changedBy: DealUserRef | null
  comment: string | null
  createdAt: string
}

export interface PaymentDto {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  comment: string | null
  paidAt: string | null
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymentListDto extends PaymentDto {
  orderNumber: number
  orderTotal: number
  orderStatus: OrderStatus
  customerName: string
}

export interface PaymentStatusHistoryDto {
  id: string
  paymentId: string
  fromStatus: PaymentStatus | null
  toStatus: PaymentStatus
  changedByUserId: string | null
  changedBy: DealUserRef | null
  comment: string | null
  createdAt: string
}

export interface PaymentDetailsDto extends PaymentDto {
  order: {
    id: string
    number: number
    total: number
    status: OrderStatus
    customer: {
      id: string
      name: string
    }
  }
  createdBy: DealUserRef | null
  statusHistory: PaymentStatusHistoryDto[]
}

export interface OrderPaymentDto extends PaymentDto {
  statusHistory: PaymentStatusHistoryDto[]
}

export interface OrderDetailsDto {
  id: string
  number: number
  dealId: string | null
  deal: {
    id: string
    name: string
    price: number
    status: string
    customerId: string
  } | null
  customerId: string
  customer: DealCustomerRef
  createdBy: DealUserRef | null
  total: number
  paid: number
  remaining: number
  status: OrderStatus
  comment: string | null
  items: OrderItemDto[]
  payments: OrderPaymentDto[]
  statusHistory: OrderStatusHistoryDto[]
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentPayload {
  orderId: string
  amount: number
  method?: PaymentMethod
  status?: PaymentStatus
  comment?: string
}

export interface ChangePaymentStatusPayload {
  status: PaymentStatus
  comment?: string
}

// ---------------------------------------------------------------------------
// Тексты ошибок — 1-в-1 с бэкендом
// ---------------------------------------------------------------------------

export type AuthErrorMessage =
  | 'Пользователь с таким email уже существует'
  | 'Неверный email или пароль'
  | 'Не пройдена проверка CAPTCHA. Попробуйте снова'
  | `Слишком много неудачных попыток. Повторите через ${string}`
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
  | 'Недостаточно прав для удаления комментария'

export type ChatErrorMessage =
  | 'Нельзя писать самому себе'
  | 'Сообщение пустое'
  | 'Пользователь не найден'

export type TaskErrorMessage =
  | `Задача ${string} не найдена`
  | 'Недостаточно прав для изменения этой задачи'

export type NotificationErrorMessage = 'Уведомление не найдено'

export type OrderErrorMessage =
  | `Заказ ${string} не найден`
  | 'Укажите либо dealId, либо customerId, но не оба сразу'
  | 'Укажите источник заказа: dealId (из сделки) или customerId (вручную)'
  | 'Укажите total или позиции заказа (items) для расчёта суммы'
  | 'Сумма заказа не может быть отрицательной'
  | `Сумма заказа (${string}) меньше уже оплаченного (${string})`
  | `Заказ в статусе "${string}" нельзя редактировать (только DRAFT/CONFIRMED)`
  | `Переход заказа из "${string}" в "${string}" запрещён`
  | `Переход в "${string}" доступен только администратору`
  | 'Заказ с движением денег нельзя удалить — отмените или верните его'

export type PaymentErrorMessage =
  | `Платёж ${string} не найден`
  | `Заказ ${string} не найден`
  | `Нельзя принимать оплату по заказу в статусе "${string}"`
  | `Нельзя подтверждать оплату по заказу в статусе "${string}"`
  | 'При создании допустимы только статусы PENDING или SUCCEEDED'
  | `Платёж ${number} превышает остаток ${number} по заказу`
  | `Переход платежа из "${string}" в "${string}" запрещён`
  | `Платёж в статусе "${string}" нельзя удалить — используйте возврат`

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
export type RegisterError = Extract<AuthErrorMessage, 'Пользователь с таким email уже существует' | 'Не пройдена проверка CAPTCHA. Попробуйте снова'>
export type LoginError = Extract<AuthErrorMessage, 'Неверный email или пароль' | `Слишком много неудачных попыток. Повторите через ${string}` | 'Email не подтверждён. Проверьте почту'>
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
export type CreateDealError = CustomerErrorMessage
export type UpdateDealError = DealErrorMessage
export type UpdateResponsiblesError = DealErrorMessage | Extract<AuthErrorMessage, 'Пользователь не найден'>
export type DeleteDealError = DealErrorMessage

export interface AllowedTransition {
  fromStage: string
  toStage: string
}

export type GetCommentsError = NoDomainError
export type CreateCommentError = Extract<CommentErrorMessage, `Сделка ${string} не найдена`>
export type DeleteCommentError = Extract<CommentErrorMessage, `Комментарий ${string} не найден`>

// --- chat -------------------------------------------------------------------
export type SearchChatError = NoDomainError
export type ConversationsError = NoDomainError
export type GetMessagesError = Extract<ChatErrorMessage, 'Нельзя писать самому себе' | 'Пользователь не найден'>
export type MarkMessagesReadError = NoDomainError
export interface MarkMessagesReadPayload {
  upToMessageId: string
}
export interface MarkMessagesReadResponse {
  read: number
}
export type SendMessageError = ChatErrorMessage
export type UnreadCountError = NoDomainError
export type UnreadDialogsError = NoDomainError

// --- tasks / notifications ---------------------------------------------------
export type GetTasksError = TaskErrorMessage
export type GetTaskError = TaskErrorMessage
export type CreateTaskError = NoDomainError
export type UpdateTaskError = TaskErrorMessage
export type DeleteTaskError = TaskErrorMessage

export type GetNotificationsError = NoDomainError
export type MarkNotificationReadError = NotificationErrorMessage
export type MarkAllNotificationsReadError = NoDomainError
export type DeleteReadNotificationsError = NoDomainError

// --- orders / payments ------------------------------------------------------
export type GetOrdersError = NoDomainError
export type GetOrderError = OrderErrorMessage
export type CreateOrderError = OrderErrorMessage
export type UpdateOrderError = OrderErrorMessage
export type ChangeOrderStatusError = OrderErrorMessage
export type DeleteOrderError = OrderErrorMessage

export type GetPaymentsError = NoDomainError
export type GetPaymentError = PaymentErrorMessage
export type CreatePaymentError = PaymentErrorMessage | OrderErrorMessage
export type ChangePaymentStatusError = PaymentErrorMessage | OrderErrorMessage
export type RefundPaymentError = PaymentErrorMessage | OrderErrorMessage
export type DeletePaymentError = PaymentErrorMessage

export interface MarkAllNotificationsReadResponse {
  updated: number
}

export interface DeleteReadNotificationsResponse {
  deleted: number
}
