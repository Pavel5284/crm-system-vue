import {COLLECTION_DEALS, useDbId} from '~/app.constants'
import type {IDeal} from '~/types/deals.types'
import {KANBAN_DATA} from './kanban.data'

export function useKanbanQuery() {
    const DB_ID = useDbId()
    
    return useQuery({
        queryKey: ['deals'],
        queryFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            const res = await DB.listDocuments(DB_ID, COLLECTION_DEALS)
            return res as unknown as { documents: IDeal[] }
        },
        select(data) {
            const newBoard = JSON.parse(JSON.stringify(KANBAN_DATA))
            const deals = data.documents as unknown as IDeal[]

            for (const deal of deals) {
                const column = newBoard.find((col: any) => col.id === deal.status)
                if (column) {
                    column.items.push({
                        $createdAt: deal.$createdAt,
                        id: deal.$id,
                        name: deal.name,
                        price: deal.price,
                        companyName: deal.customers?.name || '',
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