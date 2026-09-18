import type { DealStatus } from '~/types/backend.contracts'

export interface ICard {
    id: string
    name: string
    price: number
    createdAt: string
    company: string
    companyName: string
    responsibleName: string | null
    deadline: string | null
    status: string
}

export interface IColumn {
    id: DealStatus
    name: string
    items: ICard[]
}