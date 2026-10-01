<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { formatDate } from '~/utils/formatDate'
import { getApiErrorMessage } from '~/utils/api'
import { convertCurrency } from '~/utils/convertCurrency'
import { paymentBadgeClass } from '~/utils/billing-status'
import {
  changePaymentStatusApi,
  deletePaymentApi,
  refundPaymentApi,
} from '~/utils/billing.api'
import {
  canCreatePayment,
  canDeletePayment,
  canRefundPayment,
  canUpdateOrder,
} from '~/utils/billing-permissions'
import type {
  OrderPaymentDto,
  PaymentStatus,
} from '~/types/backend.contracts'

const props = defineProps<{
  orderId: string
  payments: OrderPaymentDto[]
  role: string | null | undefined
  remaining: number
}>()

const emit = defineEmits<{
  add: []
}>()

const { t, locale } = useI18n()
const queryClient = useQueryClient()
const error = ref('')

function invalidate() {
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  queryClient.invalidateQueries({ queryKey: ['payments'] })
  queryClient.invalidateQueries({ queryKey: ['order', props.orderId] })
}

function onError(e: unknown) {
  error.value = getApiErrorMessage(e)
}

const { mutate: changePayment, isPending: isPaymentPending } = useMutation({
  mutationKey: ['change payment status'],
  mutationFn: (input: { id: string; status: PaymentStatus }) =>
    changePaymentStatusApi(input.id, { status: input.status }),
  onSuccess: invalidate,
  onError,
})

const { mutate: refund, isPending: isRefunding } = useMutation({
  mutationKey: ['refund payment'],
  mutationFn: (id: string) => refundPaymentApi(id),
  onSuccess: invalidate,
  onError,
})

const { mutate: removePayment } = useMutation({
  mutationKey: ['delete payment'],
  mutationFn: (id: string) => deletePaymentApi(id),
  onSuccess: invalidate,
  onError,
})

const expandedPayments = ref<string[]>([])

function togglePaymentHistory(id: string) {
  expandedPayments.value = expandedPayments.value.includes(id)
    ? expandedPayments.value.filter((pid) => pid !== id)
    : [...expandedPayments.value, id]
}

function canConfirmPayment(p: OrderPaymentDto) {
  return p.status === 'PENDING' && canUpdateOrder(props.role)
}
</script>

<template>
  <h3 class="section">{{ t('orders.details.paymentsTitle') }}</h3>
  <button
    v-if="canCreatePayment(role) && remaining > 0"
    class="btn-mini mb-2"
    @click="emit('add')"
  >
    {{ t('orders.actions.addPayment') }}
  </button>
  <p v-if="!payments.length" class="muted">
    {{ t('orders.details.paymentsEmpty') }}
  </p>
  <div
    v-for="p in payments"
    :key="p.id"
    class="pay-row"
  >
    <div>
      <div class="pay-amount">{{ convertCurrency(p.amount, locale) }}</div>
      <div class="muted">
        {{ t(`payments.methodNames.${p.method}`) }} ·
        {{ formatDate(p.createdAt, 'full', locale) }}
      </div>
    </div>
    <span :class="paymentBadgeClass(p.status)">
      {{ t(`payments.status.${p.status}`) }}
    </span>
    <div class="pay-actions">
      <button
        v-if="canConfirmPayment(p)"
        class="btn-mini"
        :disabled="isPaymentPending"
        @click="changePayment({ id: p.id, status: 'SUCCEEDED' })"
      >
        {{ t('payments.actions.confirm') }}
      </button>
      <button
        v-if="p.status === 'PENDING' && canUpdateOrder(role)"
        class="btn-mini"
        :disabled="isPaymentPending"
        @click="changePayment({ id: p.id, status: 'CANCELLED' })"
      >
        {{ t('payments.actions.cancel') }}
      </button>
      <button
        v-if="p.status === 'SUCCEEDED' && canRefundPayment(role)"
        class="btn-mini"
        :disabled="isRefunding"
        @click="refund(p.id)"
      >
        {{ t('payments.actions.refund') }}
      </button>
      <button
        v-if="
          (p.status === 'PENDING' || p.status === 'FAILED') &&
          canDeletePayment(role)
        "
        class="btn-mini danger"
        @click="removePayment(p.id)"
      >
        {{ t('payments.actions.delete') }}
      </button>
      <button
        v-if="p.statusHistory?.length"
        class="btn-mini"
        @click="togglePaymentHistory(p.id)"
      >
        {{ t('payments.historyTitle') }} ({{ p.statusHistory.length }})
      </button>
    </div>
    <div
      v-if="p.statusHistory?.length && expandedPayments.includes(p.id)"
      class="pay-history"
    >
      <div v-for="h in p.statusHistory" :key="h.id" class="hist-line">
        <span class="muted">{{ formatDate(h.createdAt, 'full', locale) }}</span>
        <span>
          {{ h.fromStatus ? t(`payments.status.${h.fromStatus}`) : '—' }} →
          {{ t(`payments.status.${h.toStatus}`) }}
        </span>
        <span v-if="h.changedBy" class="muted">{{ h.changedBy.name }}</span>
        <span v-if="h.comment" class="muted">{{ h.comment }}</span>
      </div>
    </div>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
</template>

<style scoped>
.section {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.75rem 0 0.375rem;
}
.muted {
  font-size: 0.75rem;
  opacity: 0.65;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.pay-row {
  border: 1px solid #161c26;
  border-radius: 0.375rem;
  padding: 0.5rem;
  margin-bottom: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.pay-amount {
  font-weight: 600;
  font-size: 0.85rem;
}
.pay-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.pay-history {
  border-top: 1px solid #161c26;
  padding-top: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.hist-line {
  font-size: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: baseline;
}
</style>
