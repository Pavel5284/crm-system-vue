import type { IDeal } from '~/types/deals.types'
import type { IColumn } from './kanban.types'
import { KANBAN_DATA } from './kanban.data'
import { getDealsApi } from '~/utils/crm.api'

export function useKanbanQuery() {
    return useQuery<IDeal[], Error, IColumn[]>({
        queryKey: ['deals'],
        queryFn: () => getDealsApi(),
        select(data) {
            const newBoard: IColumn[] = JSON.parse(JSON.stringify(KANBAN_DATA))

            for (const deal of data) {
                const column = newBoard.find((col) => col.id === deal.status)
                if (column) {
                    column.items.push({
                        id: deal.id,
                        name: deal.name,
                        price: deal.price,
                        companyName: deal.customerName,
                        status: column.name,
                        createdAt: deal.createdAt,
                    })
                }
            }
            return newBoard
        },
        enabled: false,
        staleTime: 0,
    })
}
