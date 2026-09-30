<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useDealSlideStore } from '@/stores/deal-slide.store'
import BillingOrderCreateDialog from '~/components/billing/OrderCreateDialog.vue'
import BillingOrderDetailsDrawer from '~/components/billing/OrderDetailsDrawer.vue'
import { getOrdersApi } from '~/utils/billing.api'
import { orderBadgeClass } from '~/utils/billing-status'
import { canCreateOrder } from '~/utils/billing-permissions'
import type { OrderListDto } from '~/types/backend.contracts'

const { t, locale } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const dealId = computed(() => store.card?.id ?? null)
const canCreate = computed(() => canCreateOrder(authStore.user.role))

const createDialog = ref<InstanceType<
  typeof BillingOrderCreateDialog
> | null>(null)
const detailsDrawer = ref<InstanceType<
  typeof BillingOrderDetailsDrawer
> | null>(null)

const { data } = useQuery({
  queryKey: ['orders', 'deal', dealId],
  queryFn: () => getOrdersApi({ dealId: dealId.value as string }),
  refetchInterval: false,
  enabled: computed(() => !!dealId.value && authStore.isAuth),
})

const orders = computed(() => data.value ?? [])

function openOrder(id: string) {
  detailsDrawer.value?.open(id)
}

function onCreated(order: OrderListDto) {
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  openOrder(order.id)
}
</script>

<template>
  <div v-if="dealId" class="border-border bg-black/20 rounded p-3 mt-3">
    <div class="uppercase bold text-xl mb-3">
      {{ t('kanban.slideover.ordersTitle') }}
    </div>
    <p v-if="!orders.length" class="text-sm text-muted-foreground mb-3">
      {{ t('kanban.slideover.ordersEmpty') }}
    </p>
    <button
      v-for="o in orders"
      :key="o.id"
      class="order-row"
      @click="openOrder(o.id)"
    >
      <span class="font-medium">№{{ o.number }}</span>
      <span class="order-sum">{{ convertCurrency(o.total, locale) }}</span>
      <span :class="orderBadgeClass(o.status)">
        {{ t(`orders.status.${o.status}`) }}
      </span>
    </button>
    <UiButton
      v-if="canCreate"
      type="button"
      class="mt-1"
      @click="createDialog?.open()"
    >
      {{ t('orders.createFromDeal') }}
    </UiButton>
    <BillingOrderCreateDialog
      ref="createDialog"
      :deal-id="dealId"
      @created="onCreated"
    />
    <BillingOrderDetailsDrawer ref="detailsDrawer" />
  </div>
</template>

<style scoped>
.order-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  font-size: 0.8rem;
  border: 1px solid #161c26;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  margin-bottom: 0.375rem;
  text-align: left;
  transition: border-color 0.2s;
}
.order-row:hover {
  border-color: #482c65;
}
.order-sum {
  opacity: 0.8;
}
</style>
