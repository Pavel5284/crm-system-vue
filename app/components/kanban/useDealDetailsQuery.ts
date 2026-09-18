import { toValue, type MaybeRefOrGetter } from 'vue'
import type { DealDetailsDto } from '~/types/backend.contracts'
import { getDealApi } from '~/utils/crm.api'

// Карточка «О сделке» (GET /deals/:id): ответственный, позиции, вложения,
// история переходов. Кэшируется по ключу ['deal', id].
export function useDealDetailsQuery(dealId: MaybeRefOrGetter<string | null | undefined>) {
    const authStore = useAuthStore()
    return useQuery<DealDetailsDto, Error>({
        queryKey: ['deal', dealId],
        queryFn: () => getDealApi(toValue(dealId) as string),
        enabled: computed(() => authStore.isAuth && !!toValue(dealId)),
        staleTime: 0,
    })
}
