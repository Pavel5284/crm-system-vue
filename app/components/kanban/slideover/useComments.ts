import {COLLECTION_DEALS, useDbId} from '~/app.constants'


export function useCommentsByDeal() {
    const DB_ID = useDbId()
    const store = useDealSlideStore()
    const cardId = store.card?.id || ''

    return useQuery({
        queryKey: ['deal', cardId],
        queryFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            return DB.getDocument(DB_ID, COLLECTION_DEALS, cardId)
        },
    })
}