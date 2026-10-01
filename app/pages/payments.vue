<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { formatDate } from '~/utils/formatDate'
import { getApiErrorMessage } from '~/utils/api'
import { paymentBadgeClass } from '~/utils/billing-status'
import {
  changePaymentStatusApi,
  deletePaymentApi,
  getPaymentsApi,
  refundPaymentApi,
} from '~/utils/billing.api'
import {
  canCreatePayment,
  canDeletePayment,
  canRefundPayment,
  canUpdateOrder,
} from '~/utils/billing-permissions'
import BillingPaymentCreateDialog from '~/components/billing/PaymentCreateDialog.vue'
import BillingPaymentDetailsDrawer from '~/components/billing/PaymentDetailsDrawer.vue'
import type { PaymentListDto, PaymentStatus } from '~/types/backend.contracts'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()

useSeoMeta({ title: t('payments.seoTitle') })

const statusFilter = ref<'' | PaymentStatus>('')
const error = ref('')

const paymentDialog = ref<InstanceType<
  typeof BillingPaymentCreateDialog
> | null>(null)
const detailsDrawer = ref<InstanceType<
  typeof BillingPaymentDetailsDrawer
> | null>(null)

const { data, isLoading, refetch } = useQuery({
  queryKey: ['payments'],
  queryFn: () => getPaymentsApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth),
})

const payments = computed(() => {
  const list = data.value ?? []
  if (!statusFilter.value) return list
  return list.filter((p) => p.status === statusFilter.value)
})

function invalidate() {
  queryClient.invalidateQueries({ queryKey: ['payments'] })
  queryClient.invalidateQueries({ queryKey: ['orders'] })
  refetch()
}

const { mutate: changeStatus } = useMutation({
  mutationKey: ['change payment status'],
  mutationFn: (input: { id: string; status: PaymentStatus }) =>
    changePaymentStatusApi(input.id, { status: input.status }),
  onSuccess: invalidate,
  onError: (e) => {
    error.value = getApiErrorMessage(e)
  },
})

const { mutate: refund } = useMutation({
  mutationKey: ['refund payment'],
  mutationFn: (id: string) => refundPaymentApi(id),
  onSuccess: invalidate,
  onError: (e) => {
    error.value = getApiErrorMessage(e)
  },
})

const { mutate: remove } = useMutation({
  mutationKey: ['delete payment'],
  mutationFn: (id: string) => deletePaymentApi(id),
  onSuccess: invalidate,
  onError: (e) => {
    error.value = getApiErrorMessage(e)
  },
})

function openCreate() {
  paymentDialog.value?.open()
}

const STATUSES: PaymentStatus[] = [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
]

const canConfirm = (p: PaymentListDto) =>
  p.status === 'PENDING' && canUpdateOrder(authStore.user.role)
</script>

<template>
  <div>
    <div class="head">
      <h1 class="title">{{ t('payments.listTitle') }}</h1>
    </div>

    <div class="filters">
      <select v-model="statusFilter" class="input">
        <option value="">{{ t('payments.filters.allStatuses') }}</option>
        <option v-for="s in STATUSES" :key="s" :value="s">
          {{ t(`payments.status.${s}`) }}
        </option>
      </select>
      <UiButton
        v-if="canCreatePayment(authStore.user.role)"
        @click="openCreate"
      >
        {{ t('payments.createTitle') }}
      </UiButton>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="isLoading">{{ t('payments.loading') }}</div>
    <p v-else-if="!payments.length" class="muted">{{ t('payments.empty') }}</p>
    <UiTable v-else>
      <UiTableHeader>
        <UiTableRow>
          <UiTableHead>{{ t('payments.table.order') }}</UiTableHead>
          <UiTableHead>{{ t('payments.table.customer') }}</UiTableHead>
          <UiTableHead>{{ t('payments.table.amount') }}</UiTableHead>
          <UiTableHead>{{ t('payments.table.method') }}</UiTableHead>
          <UiTableHead>{{ t('payments.table.status') }}</UiTableHead>
          <UiTableHead>{{ t('payments.table.created') }}</UiTableHead>
          <UiTableHead />
        </UiTableRow>
      </UiTableHeader>
      <UiTableBody>
        <UiTableRow
          v-for="p in payments"
          :key="p.id"
          class="cursor-pointer hover:bg-white/5 transition-colors"
          @click="detailsDrawer?.open(p.id)"
        >
          <UiTableCell class="font-medium">№{{ p.orderNumber }}</UiTableCell>
          <UiTableCell>{{ p.customerName }}</UiTableCell>
          <UiTableCell>{{ convertCurrency(p.amount, locale) }}</UiTableCell>
          <UiTableCell>{{ t(`payments.methodNames.${p.method}`) }}</UiTableCell>
          <UiTableCell>
            <span :class="paymentBadgeClass(p.status)">
              {{ t(`payments.status.${p.status}`) }}
            </span>
          </UiTableCell>
          <UiTableCell>{{ formatDate(p.createdAt, 'full', locale) }}</UiTableCell>
          <UiTableCell @click.stop>
            <div class="row-actions">
              <button
                v-if="canConfirm(p)"
                class="btn-mini"
                @click="changeStatus({ id: p.id, status: 'SUCCEEDED' })"
              >
                {{ t('payments.actions.confirm') }}
              </button>
              <button
                v-if="p.status === 'PENDING' && canUpdateOrder(authStore.user.role)"
                class="btn-mini"
                @click="changeStatus({ id: p.id, status: 'CANCELLED' })"
              >
                {{ t('payments.actions.cancel') }}
              </button>
              <button
                v-if="
                  p.status === 'SUCCEEDED' &&
                  canRefundPayment(authStore.user.role)
                "
                class="btn-mini"
                @click="refund(p.id)"
              >
                {{ t('payments.actions.refund') }}
              </button>
              <button
                v-if="
                  (p.status === 'PENDING' ||
                    p.status === 'FAILED' ||
                    p.status === 'CANCELLED') &&
                  canDeletePayment(authStore.user.role)
                "
                class="btn-mini danger"
                @click="remove(p.id)"
              >
                {{ t('payments.actions.delete') }}
              </button>
            </div>
          </UiTableCell>
        </UiTableRow>
      </UiTableBody>
    </UiTable>

    <BillingPaymentCreateDialog ref="paymentDialog" @created="invalidate" />
    <BillingPaymentDetailsDrawer ref="detailsDrawer" />
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
  align-items: center;
}
.input {
  border: 1px solid #161c26;
}
.row-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}
.btn-mini {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  white-space: nowrap;
}
.btn-mini:hover:not(:disabled) {
  border-color: #482c65;
  color: white;
}
.btn-mini.danger {
  border-color: #5b2323;
  color: #e5a3a3;
}
.muted {
  font-size: 0.85rem;
  opacity: 0.65;
}
.error {
  font-size: 0.8rem;
  color: #e5a3a3;
  margin-bottom: 0.5rem;
}
</style>
