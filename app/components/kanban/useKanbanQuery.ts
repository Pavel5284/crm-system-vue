import {COLLECTION_DEALS, useDbId} from '~/app.constants'
import type {IDeal} from '~/types/deals.types'
import {KANBAN_DATA} from './kanban.data'
import {getDb} from '~/utils/appwite'

export function useKanbanQuery() {
    const DB = getDb()
    const DB_ID = useDbId()
    return useQuery({
        queryKey: ['deals'],
        queryFn: async () => {
            const res = await DB.listDocuments(DB_ID, COLLECTION_DEALS)
            return res as unknown as {documents: IDeal[]}
        },
        select(data) {
            const newBoard = [...KANBAN_DATA]
            const deals = data.documents as unknown as IDeal[]
            console.log(deals, newBoard)
        }
    })
}