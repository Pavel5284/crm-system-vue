import type { AllowedTransition } from '~/types/backend.contracts'
import { getAllowedTransitionsApi } from '~/utils/crm.api'

// Переходы, разрешённые ТЕКУЩЕМУ пользователю по роли
// (GET /deals/allowed-transitions). Только для UX — скрытие недоступных
// действий; проверка обязана быть на бэкенде (PATCH /deals/:id/stage).
export function useAllowedTransitionsQuery() {
    const authStore = useAuthStore()
    return useQuery<AllowedTransition[], Error>({
        queryKey: ['deal-allowed-transitions'],
        queryFn: () => getAllowedTransitionsApi(),
        enabled: computed(() => authStore.isAuth),
        staleTime: 0,
    })
}

export function isTransitionAllowed(
    transitions: AllowedTransition[] | undefined,
    fromStage: string,
    toStage: string,
): boolean {
    if (!transitions) return false
    return transitions.some((t) => t.fromStage === fromStage && t.toStage === toStage)
}
