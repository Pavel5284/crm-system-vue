import { apiFetch } from '~/utils/api'
import type {
  AllowedTransition,
  CommentDto,
  CreateCommentError,
  CreateCommentPayload,
  CreateDealError,
  CreateDealPayload,
  CustomerAvatarError,
  CustomerDto,
  DealDetailsDto,
  DealDto,
  DealStatus,
  DeleteCommentError,
  DeleteDealError,
  GetCommentsError,
  GetCustomerError,
  GetCustomersError,
  GetDealsError,
  ImportDealPayload,
  NoContent,
  SuccessResponse,
  UpdateCustomerError,
  UpdateCustomerPayload,
  UpdateDealError,
} from '~/types/backend.contracts'

export type {
  AllowedTransition,
  CommentDto,
  CreateCommentPayload,
  CreateDealPayload,
  CustomerDto,
  DealDetailsDto,
  DealDto,
  DealStatus,
  ImportDealPayload,
  UpdateCustomerPayload,
}

export const getDealsApi = () => apiFetch<DealDto[], GetDealsError>('/deals')

export const getDealApi = (dealId: string) =>
  apiFetch<DealDetailsDto, GetDealsError>(`/deals/${dealId}`)

export const getAllowedTransitionsApi = () =>
  apiFetch<AllowedTransition[]>('/deals/allowed-transitions')

export const createDealApi = (payload: CreateDealPayload) =>
  apiFetch<DealDto, CreateDealError>('/deals', { method: 'POST', body: payload })

export const deleteDealApi = (dealId: string) =>
  apiFetch<NoContent, DeleteDealError>(`/deals/${dealId}`, { method: 'DELETE' })

export const importDealApi = (payload: ImportDealPayload) =>
  apiFetch<DealDto, CreateDealError>('/deals/import', { method: 'POST', body: payload })

export const updateDealStatusApi = (dealId: string, status: DealStatus, comment: string) =>
  apiFetch<DealDto, UpdateDealError>(`/deals/${dealId}/stage`, { method: 'PATCH', body: { targetStage: status, comment } })

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
