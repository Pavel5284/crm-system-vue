import { getCommentsApi } from '~/utils/crm.api'

export function useComments() {
    const store = useDealSlideStore()
    const cardId = store.card?.id || ''

    return useQuery({
        queryKey: ['comments', cardId],
        queryFn: () => getCommentsApi(cardId),
    })
}
