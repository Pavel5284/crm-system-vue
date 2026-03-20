export interface IBaseField {
    $createdAt: string
    $id: string
}

export interface ICustomer extends IBaseField {
    name: string
    email: string
    avatar_url: string
    from_source?: string
}

export interface IComment extends IBaseField {
    text: string
}

export enum EnumStatus {
    'todo' = 'todo',
    'to-be-agreed' = 'to-be-greed',
    'in-progress' = 'in-progress',
    'produced' = 'produced',
    'done' = 'done',
}

export interface IDeal extends IBaseField {
    comments: IComment[]
    customers: ICustomer
    name: string
    price: number
    status: EnumStatus
}