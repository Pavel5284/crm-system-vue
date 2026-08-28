import { apiFetch } from '~/utils/api'
import type {
    EnumStatus,
    IComment,
    ICustomer,
    IDeal,
} from '~/types/deals.types'

export interface CreateDealPayload {
    name: string
    price: number
    customerEmail: string
    customerName: string
    status: EnumStatus
}

export const getDealsApi = () => apiFetch<IDeal[]>('/deals')

export const createDealApi = (payload: CreateDealPayload) =>
    apiFetch<IDeal>('/deals', { method: 'POST', body: payload })

export const updateDealStatusApi = (dealId: string, status: EnumStatus) =>
    apiFetch<IDeal>(`/deals/${dealId}`, { method: 'PATCH', body: { status } })

export const getCustomersApi = () => apiFetch<ICustomer[]>('/customers')

export const updateCustomerApi = (
    customerId: string,
    payload: {
        name?: string
        email?: string
        avatarUrl?: string
        fromSource?: string | null
    },
) => apiFetch<ICustomer>(`/customers/${customerId}`, { method: 'PATCH', body: payload })

export const getCommentsApi = (dealId: string) =>
    apiFetch<IComment[]>('/comments', { query: { dealId } })

export const createCommentApi = (payload: { dealId: string; text: string }) =>
    apiFetch<IComment>('/comments', { method: 'POST', body: payload })

export const deleteCommentApi = (commentId: string) =>
    apiFetch<null>(`/comments/${commentId}`, { method: 'DELETE' })
