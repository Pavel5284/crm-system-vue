import {COLLECTION_COMMENTS, useDbId} from '~/app.constants'
import {Query} from '~/utils/appwite'

export function useComments() {
    const DB_ID = useDbId()
    const store = useDealSlideStore()
    const cardId = store.card?.id || ''

    return useQuery({
        queryKey: ['comments', cardId],
        queryFn: async () => {
            const { getDb } = await import('~/utils/appwite')
            const DB = getDb()
            const response = await DB.listDocuments(DB_ID, COLLECTION_COMMENTS, [
                Query.equal('deal', cardId),
            ])
            return response.documents
        },
    })
}