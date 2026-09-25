import type { ICard } from '~/components/kanban/kanban.types'
import { getDealApi } from '~/utils/crm.api'

/**
 * Открытие слайовера сделки из уведомлений (и любых других мест вне канбана).
 * Слайовер живёт на странице канбана (`/`), поэтому:
 * - если мы не на `/` — сначала переходим туда, затем открываем;
 * - карточку собираем из GET /deals/:id (тот же маппинг, что в useKanbanQuery).
 */
export const useOpenDeal = () => {
  const router = useRouter()
  const route = useRoute()
  const store = useDealSlideStore()
  const opening = ref(false)

  const openDealById = async (dealId: string): Promise<boolean> => {
    if (!dealId || opening.value) return false
    opening.value = true
    try {
      const deal = await getDealApi(dealId)
      const card: ICard = {
        id: deal.id,
        name: deal.name,
        price: deal.price,
        customerId: deal.customerId,
        customerName: deal.customer?.name ?? '',
        responsibleName: deal.responsibleName ?? null,
        deadline: deal.deadline ?? null,
        status: deal.status,
        createdAt: deal.createdAt,
      }
      if (route.path !== '/') {
        await router.push('/')
        // Даём канбану смонтироваться и повесить слайовер.
        await nextTick()
      }
      store.set(card)
      return true
    } catch {
      return false
    } finally {
      opening.value = false
    }
  }

  return { openDealById, opening: readonly(opening) }
}
