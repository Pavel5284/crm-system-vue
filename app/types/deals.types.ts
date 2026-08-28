export interface IBaseField {
    id: string
    createdAt: string
}

export interface ICustomer extends IBaseField {
    name: string
    email: string
    avatarUrl: string
    fromSource?: string | null
}

export interface IComment extends IBaseField {
    text: string
    dealId: string
    userName: string
    userEmail: string
}

export enum EnumStatus {
    'todo' = 'todo',
    'to-be-agreed' = 'to-be-agreed',
    'in-progress' = 'in-progress',
    'produced' = 'produced',
    'done' = 'done',
}

export interface IDeal extends IBaseField {
    name: string
    price: number
    status: EnumStatus
    customerId: string
    customerName: string
    customerEmail: string
}
