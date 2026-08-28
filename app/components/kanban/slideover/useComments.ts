import { getCommentsApi } from '~/utils/crm.api'

export function useComments() {
    const store = useDealSlideStore()

    return useQuery({
        queryKey: ['comments', computed(() => store.card?.id || '')],
        queryFn: () => getCommentsApi(store.card?.id || ''),
        enabled: computed(() => !!store.card?.id),
    })
}
