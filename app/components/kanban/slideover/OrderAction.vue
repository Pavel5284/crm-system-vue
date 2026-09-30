<script setup lang="ts">
import BillingOrderCreateDialog from '~/components/billing/OrderCreateDialog.vue'
import { canCreateOrder } from '~/utils/billing-permissions'
import type { OrderListDto } from '~/types/backend.contracts'

const { t } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()

const createDialog = ref<InstanceType<
  typeof BillingOrderCreateDialog
> | null>(null)

const dealId = computed(() => store.card?.id ?? null)
const visible = computed(
  () => !!dealId.value && canCreateOrder(authStore.user.role),
)

function onCreated(order: OrderListDto) {
  store.isOpen = false
  navigateTo({ path: '/orders', query: { order: order.id } })
}
</script>

<template>
  <div v-if="visible" class="border-border bg-black/20 rounded p-3 mt-3">
    <UiButton type="button" @click="createDialog?.open()">
      {{ t('orders.createFromDeal') }}
    </UiButton>
    <BillingOrderCreateDialog
      ref="createDialog"
      :deal-id="dealId"
      @created="onCreated"
    />
  </div>
</template>
