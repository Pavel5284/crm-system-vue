import { apiFetch } from '~/utils/api'
import type {
  CommentDto,
  CreateCommentError,
  CreateCommentPayload,
  CreateDealError,
  CreateDealPayload,
  CustomerAvatarError,
  CustomerDto,
  DealDto,
  DealStatus,
  DeleteCommentError,
  GetCommentsError,
  GetCustomerError,
  GetCustomersError,
  GetDealsError,
  NoContent,
  SuccessResponse,
  UpdateCustomerError,
  UpdateCustomerPayload,
  UpdateDealError,
} from '~/types/backend.contracts'

export type {
  CommentDto,
  CreateCommentPayload,
  CreateDealPayload,
  CustomerDto,
  DealDto,
  DealStatus,
  UpdateCustomerPayload,
}

export const getDealsApi = () => apiFetch<DealDto[], GetDealsError>('/deals')

export const createDealApi = (payload: CreateDealPayload) =>
  apiFetch<DealDto, CreateDealError>('/deals', { method: 'POST', body: payload })

export const updateDealStatusApi = (dealId: string, status: DealStatus) =>
  apiFetch<DealDto, UpdateDealError>(`/deals/${dealId}`, { method: 'PATCH', body: { status } })

export const getCustomersApi = () => apiFetch<CustomerDto[], GetCustomersError>('/customers')

export const getCustomerApi = (customerId: string) =>
  apiFetch<CustomerDto, GetCustomerError>(`/customers/${customerId}`)

export const updateCustomerApi = (customerId: string, payload: UpdateCustomerPayload) =>
  apiFetch<CustomerDto, UpdateCustomerError>(`/customers/${customerId}`, { method: 'PATCH', body: payload })

export const updateCustomerAvatarApi = (customerId: string, avatarUrl: string) =>
  apiFetch<SuccessResponse, CustomerAvatarError>(`/customers/${customerId}/avatar`, { method: 'POST', body: { avatarUrl } })

export const deleteCustomerAvatarApi = (customerId: string) =>
  apiFetch<SuccessResponse, CustomerAvatarError>(`/customers/${customerId}/avatar`, { method: 'DELETE' })

export const getCommentsApi = (dealId: string) =>
  apiFetch<CommentDto[], GetCommentsError>('/comments', { query: { dealId } })

export const createCommentApi = (payload: CreateCommentPayload) =>
  apiFetch<CommentDto, CreateCommentError>('/comments', { method: 'POST', body: payload })

export const deleteCommentApi = (commentId: string): Promise<void> =>
  apiFetch<NoContent, DeleteCommentError>(`/comments/${commentId}`, { method: 'DELETE' })
