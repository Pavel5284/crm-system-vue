import { apiFetch } from '~/utils/api'
import type {
  ChangeOrderStatusError,
  ChangeOrderStatusPayload,
  ChangePaymentStatusError,
  ChangePaymentStatusPayload,
  CreateOrderError,
  CreateOrderPayload,
  CreatePaymentError,
  CreatePaymentPayload,
  DeleteOrderError,
  DeletePaymentError,
  GetOrderError,
  GetOrdersError,
  GetPaymentError,
  GetPaymentsError,
  NoContent,
  OrderDetailsDto,
  OrderListDto,
  OrderStatus,
  PaymentDetailsDto,
  PaymentDto,
  PaymentListDto,
  PaymentStatus,
  RefundPaymentError,
  UpdateOrderError,
  UpdateOrderPayload,
} from '~/types/backend.contracts'

export const getOrdersApi = (query?: {
  status?: OrderStatus
  customerId?: string
  dealId?: string
}) =>
  apiFetch<OrderListDto[], GetOrdersError>('/orders', {
    query: query as Record<string, string | undefined>,
  })

export const getOrderApi = (orderId: string) =>
  apiFetch<OrderDetailsDto, GetOrderError>(`/orders/${orderId}`)

export const createOrderApi = (payload: CreateOrderPayload) =>
  apiFetch<OrderListDto, CreateOrderError>('/orders', {
    method: 'POST',
    body: payload,
  })

export const updateOrderApi = (orderId: string, payload: UpdateOrderPayload) =>
  apiFetch<OrderListDto, UpdateOrderError>(`/orders/${orderId}`, {
    method: 'PATCH',
    body: payload,
  })

export const changeOrderStatusApi = (
  orderId: string,
  payload: ChangeOrderStatusPayload,
) =>
  apiFetch<OrderDetailsDto, ChangeOrderStatusError>(
    `/orders/${orderId}/status`,
    { method: 'PATCH', body: payload },
  )

export const deleteOrderApi = (orderId: string) =>
  apiFetch<NoContent, DeleteOrderError>(`/orders/${orderId}`, {
    method: 'DELETE',
  })

export const getPaymentsApi = (query?: {
  orderId?: string
  status?: PaymentStatus
}) =>
  apiFetch<PaymentListDto[], GetPaymentsError>('/payments', {
    query: query as Record<string, string | undefined>,
  })

export const getPaymentApi = (paymentId: string) =>
  apiFetch<PaymentDetailsDto, GetPaymentError>(`/payments/${paymentId}`)

export const createPaymentApi = (payload: CreatePaymentPayload) =>
  apiFetch<PaymentDto, CreatePaymentError>('/payments', {
    method: 'POST',
    body: payload,
  })

export const changePaymentStatusApi = (
  paymentId: string,
  payload: ChangePaymentStatusPayload,
) =>
  apiFetch<PaymentDto, ChangePaymentStatusError>(
    `/payments/${paymentId}/status`,
    { method: 'PATCH', body: payload },
  )

export const refundPaymentApi = (paymentId: string, comment?: string) =>
  apiFetch<PaymentDto, RefundPaymentError>(`/payments/${paymentId}/refund`, {
    method: 'POST',
    body: comment ? { comment } : {},
  })

export const deletePaymentApi = (paymentId: string) =>
  apiFetch<NoContent, DeletePaymentError>(`/payments/${paymentId}`, {
    method: 'DELETE',
  })
