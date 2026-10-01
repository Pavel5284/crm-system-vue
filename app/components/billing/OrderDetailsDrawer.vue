<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { getApiErrorMessage } from '~/utils/api'
import BillingPaymentCreateDialog from '~/components/billing/PaymentCreateDialog.vue'
import BillingOrderInvoice from '~/components/billing/OrderInvoice.vue'
import {
  changeOrderStatusApi,
  deleteOrderApi,
  getOrderApi,
} from '~/utils/billing.api'
import {
  canCancelOrder,
  canDeleteOrder,
  canUpdateOrder,
} from '~/utils/billing-permissions'
import type { OrderStatus } from '~/types/backend.contracts'

const { t } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const isOpen = ref(false)
const orderId = ref<string | null>(null)
const view = ref<'details' | 'invoice'>('details')
const error = ref('')
const confirmDelete = ref(false)

const paymentDialog = ref<InstanceType<
  typeof BillingPaymentCreateDialog
> | null>(null)

function open(id: string) {
  orderId.value = id
  view.value = 'details'
  error.value = ''
  confirmDelete.value = false
  isOpen.value = true
}

defineExpose({ open })

const { data: order, isLoading } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => getOrderApi(orderId.value as string),
  refetchInterval: false,
  enabled: computed(() => isOpen.value && !!orderId.value && authStore.isAuth),
})

const role = computed(() => authStore.user.role)

function invalidate() {
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  queryClient.invalidateQueries({ queryKey: ['payments'] })
  if (orderId.value)
    queryClient.invalidateQueries({ queryKey: ['order', orderId.value] })
}

function onError(e: unknown) {
  error.value = getApiErrorMessage(e)
}

const { mutate: changeStatus, isPending: isStatusPending } = useMutation({
  mutationKey: ['change order status'],
  mutationFn: (status: OrderStatus) =>
    changeOrderStatusApi(orderId.value as string, { status }),
  onSuccess: invalidate,
  onError,
})

const { mutate: removeOrder, isPending: isDeleting } = useMutation({
  mutationKey: ['delete order'],
  mutationFn: () => deleteOrderApi(orderId.value as string),
  onSuccess() {
    invalidate()
    isOpen.value = false
  },
  onError,
})

function openPaymentDialog() {
  if (!order.value) return
  paymentDialog.value?.open({
    orderId: order.value.id,
    orderLabel: `${t('orders.invoice.orderNo')} №${order.value.number} · ${order.value.customer.name}`,
    remaining: order.value.remaining,
  })
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="right"
    :title="`${t('orders.details.title')} №${order?.number ?? ''}`"
  >
    <template #body>
      <div v-if="isLoading">{{ t('orders.loading') }}</div>

      <template v-else-if="order && view === 'details'">
        <BillingOrderInfo :order="order" />

        <div class="actions">
          <button
            v-if="order.status === 'DRAFT' && canUpdateOrder(role)"
            class="btn-mini"
            :disabled="isStatusPending"
            @click="changeStatus('CONFIRMED')"
          >
            {{ t('orders.actions.confirm') }}
          </button>
          <button
            v-if="
              order.status !== 'CANCELLED' &&
              order.status !== 'REFUNDED' &&
              canCancelOrder(role)
            "
            class="btn-mini danger"
            :disabled="isStatusPending"
            @click="changeStatus('CANCELLED')"
          >
            {{ t('orders.actions.cancel') }}
          </button>
          <button
            v-if="order.status === 'PAID' && canCancelOrder(role)"
            class="btn-mini"
            :disabled="isStatusPending"
            @click="changeStatus('REFUNDED')"
          >
            {{ t('orders.actions.refund') }}
          </button>
          <button class="btn-mini" @click="view = 'invoice'">
            {{ t('orders.actions.invoice') }}
          </button>
          <div v-if="canDeleteOrder(role)" class="mt-1">
            <button
              v-if="!confirmDelete"
              class="btn-mini danger"
              @click="confirmDelete = true"
            >
              {{ t('orders.actions.delete') }}
            </button>
            <div v-else class="confirm-box">
              <p>{{ t('orders.deleteConfirmText', { number: order.number }) }}</p>
              <div class="confirm-actions">
                <button
                  class="btn-mini danger"
                  :disabled="isDeleting"
                  @click="removeOrder()"
                >
                  {{ t('orders.deleteConfirmYes') }}
                </button>
                <button class="btn-mini" @click="confirmDelete = false">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <BillingOrderItems :order="order" :role="role" />

        <BillingOrderPayments
          :order-id="order.id"
          :payments="order.payments"
          :role="role"
          :remaining="order.remaining"
          @add="openPaymentDialog"
        />

        <h3 class="section">{{ t('orders.details.historyTitle') }}</h3>
        <BillingStatusHistory
          :items="order.statusHistory"
          status-i18n-prefix="orders.status"
          :empty-text="t('orders.details.historyEmpty')"
        />

        <p v-if="error" class="error">{{ error }}</p>
      </template>

      <template v-else-if="order && view === 'invoice'">
        <button class="btn-mini mb-3" @click="view = 'details'">←</button>
        <BillingOrderInvoice :order="order" />
      </template>

      <BillingPaymentCreateDialog ref="paymentDialog" @created="invalidate" />
    </template>
  </USlideover>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}
.section {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.75rem 0 0.375rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
</style>
