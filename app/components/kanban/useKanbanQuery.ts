import {COLLECTION_DEALS, COLLECTION_CUSTOMERS, useDbId} from '~/app.constants'
import type {IDeal} from '~/types/deals.types'
import type {IColumn} from './kanban.types'
import {KANBAN_DATA} from './kanban.data'

export function useKanbanQuery() {
    const DB_ID = useDbId()
    
    return useQuery<{ documents: IDeal[] }, Error, IColumn[]>({
        queryKey: ['deals'],
        queryFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            const [dealsRes, customersRes] = await Promise.all([
                DB.listDocuments(DB_ID, COLLECTION_DEALS),
                DB.listDocuments(DB_ID, COLLECTION_CUSTOMERS)
            ])
            
            const customersMap = new Map<string, string>()
            for (const doc of customersRes.documents) {
                customersMap.set(doc.$id, (doc as unknown as { name: string }).name)
            }
            
            const deals = dealsRes.documents.map(deal => ({
                ...deal,
                customer: customersMap.get(deal.customer as string) || ''
            }))
            
            return { documents: deals } as unknown as { documents: IDeal[] }
        },
        select(data) {
            const newBoard: IColumn[] = JSON.parse(JSON.stringify(KANBAN_DATA))
            const deals = data.documents as unknown as IDeal[]

            for (const deal of deals) {
                const column = newBoard.find((col) => col.id === deal.status)
                if (column) {
                    column.items.push({
                        $createdAt: deal.$createdAt,
                        id: deal.$id,
                        name: deal.name,
                        price: deal.price,
                        companyName: deal.customer,
                        status: column.name
                    })
                }
            }
            return newBoard
        },
        enabled: false,
        staleTime: 0,
    })
}