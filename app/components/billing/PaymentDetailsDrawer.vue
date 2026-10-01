<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { formatDate } from '~/utils/formatDate'
import { getApiErrorMessage } from '~/utils/api'
import {
  changePaymentStatusApi,
  deletePaymentApi,
  getPaymentApi,
  refundPaymentApi,
} from '~/utils/billing.api'
import { paymentBadgeClass } from '~/utils/billing-status'
import {
  canDeletePayment,
  canRefundPayment,
  canUpdateOrder,
} from '~/utils/billing-permissions'
import BillingOrderDetailsDrawer from '~/components/billing/OrderDetailsDrawer.vue'
import type { PaymentStatus } from '~/types/backend.contracts'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const isOpen = ref(false)
const paymentId = ref<string | null>(null)
const error = ref('')

const orderDrawer = ref<InstanceType<
  typeof BillingOrderDetailsDrawer
> | null>(null)

function open(id: string) {
  paymentId.value = id
  isOpen.value = true
}

defineExpose({ open })

const { data: payment, isLoading } = useQuery({
  queryKey: ['payment', paymentId],
  queryFn: () => getPaymentApi(paymentId.value as string),
  refetchInterval: false,
  enabled: computed(() => isOpen.value && !!paymentId.value && authStore.isAuth),
})

const role = computed(() => authStore.user.role)

function invalidate() {
  queryClient.invalidateQueries({ queryKey: ['payments'] })
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  queryClient.invalidateQueries({ queryKey: ['order'] })
  if (paymentId.value)
    queryClient.invalidateQueries({ queryKey: ['payment', paymentId.value] })
}

function onError(e: unknown) {
  error.value = getApiErrorMessage(e)
}

const { mutate: changeStatus, isPending: isStatusPending } = useMutation({
  mutationKey: ['change payment status'],
  mutationFn: (status: PaymentStatus) =>
    changePaymentStatusApi(paymentId.value as string, { status }),
  onSuccess: invalidate,
  onError,
})

const { mutate: refund, isPending: isRefunding } = useMutation({
  mutationKey: ['refund payment'],
  mutationFn: () => refundPaymentApi(paymentId.value as string),
  onSuccess: invalidate,
  onError,
})

const { mutate: remove, isPending: isDeleting } = useMutation({
  mutationKey: ['delete payment'],
  mutationFn: () => deletePaymentApi(paymentId.value as string),
  onSuccess() {
    invalidate()
    isOpen.value = false
  },
  onError,
})

function openOrder() {
  if (!payment.value) return
  orderDrawer.value?.open(payment.value.order.id)
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="right"
    :title="t('payments.details.title')"
  >
    <template #body>
      <div v-if="isLoading">{{ t('payments.loading') }}</div>

      <template v-else-if="payment">
        <div class="head">
          <span :class="paymentBadgeClass(payment.status)">
            {{ t(`payments.status.${payment.status}`) }}
          </span>
          <span class="total">{{ convertCurrency(payment.amount, locale) }}</span>
        </div>

        <div class="grid">
          <div>
            <span class="k">{{ t('payments.details.order') }}</span>
            <span class="v">№{{ payment.order.number }}</span>
          </div>
          <div>
            <span class="k">{{ t('payments.details.customer') }}</span>
            <span class="v">{{ payment.order.customer.name }}</span>
          </div>
          <div>
            <span class="k">{{ t('payments.method') }}</span>
            <span class="v">{{ t(`payments.methodNames.${payment.method}`) }}</span>
          </div>
          <div>
            <span class="k">{{ t('payments.table.created') }}</span>
            <span class="v">{{ formatDate(payment.createdAt, 'full', locale) }}</span>
          </div>
          <div v-if="payment.paidAt">
            <span class="k">{{ t('payments.details.paidAt') }}</span>
            <span class="v">{{ formatDate(payment.paidAt, 'full', locale) }}</span>
          </div>
          <div v-if="payment.createdBy">
            <span class="k">{{ t('payments.details.createdBy') }}</span>
            <span class="v">{{ payment.createdBy.name }}</span>
          </div>
          <div v-if="payment.comment">
            <span class="k">{{ t('payments.details.comment') }}</span>
            <span class="v">{{ payment.comment }}</span>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="payment.status === 'PENDING' && canUpdateOrder(role)"
            class="btn-mini"
            :disabled="isStatusPending"
            @click="changeStatus('SUCCEEDED')"
          >
            {{ t('payments.actions.confirm') }}
          </button>
          <button
            v-if="payment.status === 'PENDING' && canUpdateOrder(role)"
            class="btn-mini"
            :disabled="isStatusPending"
            @click="changeStatus('CANCELLED')"
          >
            {{ t('payments.actions.cancel') }}
          </button>
          <button
            v-if="payment.status === 'SUCCEEDED' && canRefundPayment(role)"
            class="btn-mini"
            :disabled="isRefunding"
            @click="refund()"
          >
            {{ t('payments.actions.refund') }}
          </button>
          <button
            v-if="
              (payment.status === 'PENDING' ||
                payment.status === 'FAILED' ||
                payment.status === 'CANCELLED') &&
              canDeletePayment(role)
            "
            class="btn-mini danger"
            :disabled="isDeleting"
            @click="remove()"
          >
            {{ t('payments.actions.delete') }}
          </button>
          <button class="btn-mini" @click="openOrder">
            {{ t('payments.details.openOrder') }}
          </button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>

        <h3 class="section">{{ t('payments.historyTitle') }}</h3>
        <BillingStatusHistory
          :items="payment.statusHistory"
          status-i18n-prefix="payments.status"
          :empty-text="t('payments.historyEmpty')"
        />
      </template>
    </template>
  </USlideover>
  <BillingOrderDetailsDrawer ref="orderDrawer" />
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.total {
  font-weight: 700;
  font-size: 1rem;
}
.grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}
.k {
  opacity: 0.6;
  margin-right: 0.375rem;
}
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
</style>
