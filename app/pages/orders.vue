<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { getOrdersApi } from '~/utils/billing.api'
import { orderBadgeClass } from '~/utils/billing-status'
import { canCreateOrder } from '~/utils/billing-permissions'
import BillingOrderCreateDialog from '~/components/billing/OrderCreateDialog.vue'
import BillingOrderDetailsDrawer from '~/components/billing/OrderDetailsDrawer.vue'
import type { OrderStatus } from '~/types/backend.contracts'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const route = useRoute()

useSeoMeta({ title: t('orders.seoTitle') })

const createDialog = ref<InstanceType<
  typeof BillingOrderCreateDialog
> | null>(null)
const detailsDrawer = ref<InstanceType<
  typeof BillingOrderDetailsDrawer
> | null>(null)

const statusFilter = ref<'' | OrderStatus>('')
const search = ref('')

const { data, isLoading, refetch } = useQuery({
  queryKey: ['orders'],
  queryFn: () => getOrdersApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth),
})

const orders = computed(() => {
  const list = data.value ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((o) => {
    const statusOk = !statusFilter.value || o.status === statusFilter.value
    const queryOk =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      (o.dealName ?? '').toLowerCase().includes(q) ||
      String(o.number).includes(q)
    return statusOk && queryOk
  })
})

const STATUSES: OrderStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
  'REFUNDED',
]

// Прямой переход из сделки: /orders?order=<id> сразу открывает детали.
watch(
  [() => route.query.order, () => authStore.isAuth],
  ([orderParam, isAuth]) => {
    if (typeof orderParam === 'string' && orderParam && isAuth) {
      detailsDrawer.value?.open(orderParam)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <div class="head">
      <h1 class="title">{{ t('orders.listTitle') }}</h1>
      <UiButton
        v-if="canCreateOrder(authStore.user.role)"
        @click="createDialog?.open()"
      >
        {{ t('orders.createTitle') }}
      </UiButton>
    </div>

    <div class="filters">
      <select v-model="statusFilter" class="input">
        <option value="">{{ t('orders.filters.allStatuses') }}</option>
        <option v-for="s in STATUSES" :key="s" :value="s">
          {{ t(`orders.status.${s}`) }}
        </option>
      </select>
      <UiInput
        v-model="search"
        :placeholder="t('orders.filters.search')"
        type="text"
        class="input"
      />
    </div>

    <div v-if="isLoading">{{ t('orders.loading') }}</div>
    <p v-else-if="!orders.length" class="muted">{{ t('orders.empty') }}</p>
    <UiTable v-else>
      <UiTableHeader>
        <UiTableRow>
          <UiTableHead>{{ t('orders.table.number') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.customer') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.deal') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.total') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.paid') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.remaining') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.status') }}</UiTableHead>
          <UiTableHead>{{ t('orders.table.created') }}</UiTableHead>
        </UiTableRow>
      </UiTableHeader>
      <UiTableBody>
        <UiTableRow
          v-for="o in orders"
          :key="o.id"
          class="cursor-pointer hover:bg-white/5 transition-colors"
          @click="detailsDrawer?.open(o.id)"
        >
          <UiTableCell class="font-medium">№{{ o.number }}</UiTableCell>
          <UiTableCell>{{ o.customerName }}</UiTableCell>
          <UiTableCell>{{ o.dealName ?? '—' }}</UiTableCell>
          <UiTableCell>{{ convertCurrency(o.total, locale) }}</UiTableCell>
          <UiTableCell>{{ convertCurrency(o.paid, locale) }}</UiTableCell>
          <UiTableCell>{{ convertCurrency(o.remaining, locale) }}</UiTableCell>
          <UiTableCell>
            <span :class="orderBadgeClass(o.status)">
              {{ t(`orders.status.${o.status}`) }}
            </span>
          </UiTableCell>
          <UiTableCell>{{ formatDate(o.createdAt, 'full', locale) }}</UiTableCell>
        </UiTableRow>
      </UiTableBody>
    </UiTable>

    <BillingOrderCreateDialog ref="createDialog" @created="refetch()" />
    <BillingOrderDetailsDrawer ref="detailsDrawer" />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.title {
  font-weight: 700;
  font-size: 1.25rem;
}
.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.muted {
  font-size: 0.85rem;
  opacity: 0.65;
}
</style>
