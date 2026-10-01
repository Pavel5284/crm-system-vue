<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { formatDate } from '~/utils/formatDate'
import { getApiErrorMessage } from '~/utils/api'
import {
  CUSTOM_UNIT,
  UNIT_CODES,
  orderBadgeClass,
  paymentBadgeClass,
  toOrderItemPayload,
  type ItemDraft,
} from '~/utils/billing-status'
import BillingItemsEditor from '~/components/billing/ItemsEditor.vue'
import BillingPaymentCreateDialog from '~/components/billing/PaymentCreateDialog.vue'
import BillingOrderInvoice from '~/components/billing/OrderInvoice.vue'
import {
  changeOrderStatusApi,
  changePaymentStatusApi,
  deleteOrderApi,
  deletePaymentApi,
  getOrderApi,
  refundPaymentApi,
  updateOrderApi,
} from '~/utils/billing.api'
import {
  canCancelOrder,
  canCreatePayment,
  canDeleteOrder,
  canDeletePayment,
  canRefundPayment,
  canUpdateOrder,
} from '~/utils/billing-permissions'
import type {
  OrderStatus,
  PaymentDto,
  PaymentStatus,
} from '~/types/backend.contracts'

const { t, locale } = useI18n()
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
  expandedPayments.value = []
  editing.value = false
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

// Правка заказа (только DRAFT/CONFIRMED — как на бэкенде).
// Позиции заменяются целиком, итог бэкенд пересчитает сам.
const canEditOrder = computed(
  () =>
    canUpdateOrder(role.value) &&
    (order.value?.status === 'DRAFT' || order.value?.status === 'CONFIRMED'),
)

const editing = ref(false)
const editComment = ref('')
const editItems = ref<ItemDraft[]>([])
const editError = ref('')

function unitToDraft(unit: string | null): Pick<ItemDraft, 'unitSelect' | 'unitCustom'> {
  if (!unit) return { unitSelect: '', unitCustom: '' }
  if ((UNIT_CODES as readonly string[]).includes(unit))
    return { unitSelect: unit, unitCustom: '' }
  return { unitSelect: CUSTOM_UNIT, unitCustom: unit }
}

function startEdit() {
  if (!order.value) return
  editing.value = true
  editError.value = ''
  editComment.value = order.value.comment ?? ''
  editItems.value = order.value.items.map((item, idx) => ({
    key: idx + 1,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    ...unitToDraft(item.unit),
  }))
}

const { mutate: saveEdit, isPending: isSaving } = useMutation({
  mutationKey: ['update order'],
  mutationFn: () =>
    updateOrderApi(orderId.value as string, {
      comment: editComment.value,
      items: toOrderItemPayload(editItems.value),
    }),
  onSuccess() {
    invalidate()
    editing.value = false
  },
  onError(e) {
    editError.value = getApiErrorMessage(e)
  },
})

// Подпись единицы в списке позиций (код → локализация,
// старые строки — как есть).
function unitText(unit: string | null): string {
  if (!unit) return ''
  const key = `orders.units.${unit}`
  const label = t(key)
  return label !== key ? ` ${label}` : ` ${unit}`
}

function openPaymentDialog() {
  if (!order.value) return
  paymentDialog.value?.open({
    orderId: order.value.id,
    orderLabel: `${t('orders.invoice.orderNo')} №${order.value.number} · ${order.value.customer.name}`,
    remaining: order.value.remaining,
  })
}

function canConfirmPayment(p: PaymentDto) {
  return p.status === 'PENDING' && canUpdateOrder(role.value)
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
        <div class="head">
          <span :class="orderBadgeClass(order.status)">
            {{ t(`orders.status.${order.status}`) }}
          </span>
          <span class="total">{{ convertCurrency(order.total, locale) }}</span>
        </div>

        <div class="grid">
          <div>
            <span class="k">{{ t('orders.details.customer') }}</span>
            <span class="v">{{ order.customer.name }}</span>
          </div>
          <div>
            <span class="k">{{ t('orders.details.deal') }}</span>
            <span class="v">{{ order.deal?.name ?? t('orders.details.noDeal') }}</span>
          </div>
          <div>
            <span class="k">{{ t('orders.details.paid') }}</span>
            <span class="v">{{ convertCurrency(order.paid, locale) }}</span>
          </div>
          <div>
            <span class="k">{{ t('orders.details.remaining') }}</span>
            <span class="v">{{ convertCurrency(order.remaining, locale) }}</span>
          </div>
          <div>
            <span class="k">{{ t('orders.details.createdAt') }}</span>
            <span class="v">{{ formatDate(order.createdAt, 'full', locale) }}</span>
          </div>
          <div v-if="order.comment">
            <span class="k">{{ t('orders.details.comment') }}</span>
            <span class="v">{{ order.comment }}</span>
          </div>
        </div>

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
          <button
            v-if="canEditOrder && !editing"
            class="btn-mini"
            @click="startEdit"
          >
            {{ t('orders.actions.edit') }}
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

        <h3 class="section">{{ t('orders.items') }}</h3>
        <div v-if="!editing">
          <p v-if="!order.items.length" class="muted">—</p>
          <div v-for="item in order.items" :key="item.id" class="item-line">
            <span class="font-medium">{{ item.name }}</span>
            <span class="muted">
              {{ item.quantity }}{{ unitText(item.unit) }} ×
              {{ convertCurrency(item.price, locale) }} =
              {{ convertCurrency(item.lineTotal, locale) }}
            </span>
          </div>
        </div>
        <div v-else>
          <div class="field">
            <label class="label">{{ t('orders.comment') }}</label>
            <UiInput
              v-model="editComment"
              :placeholder="t('orders.commentPlaceholder')"
              type="text"
              class="input"
            />
          </div>
          <BillingItemsEditor v-model="editItems" />
          <p v-if="editError" class="error">{{ editError }}</p>
          <div class="actions">
            <button class="btn-mini" :disabled="isSaving" @click="saveEdit()">
              {{ isSaving ? t('common.saving') : t('common.save') }}
            </button>
            <button class="btn-mini" @click="editing = false">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>

        <h3 class="section">{{ t('orders.details.paymentsTitle') }}</h3>
        <button
          v-if="canCreatePayment(role) && order.remaining > 0"
          class="btn-mini mb-2"
          @click="openPaymentDialog"
        >
          {{ t('orders.actions.addPayment') }}
        </button>
        <p v-if="!order.payments.length" class="muted">
          {{ t('orders.details.paymentsEmpty') }}
        </p>
        <div
          v-for="p in order.payments"
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

        <h3 class="section">{{ t('orders.details.historyTitle') }}</h3>
        <p v-if="!order.statusHistory.length" class="muted">
          {{ t('orders.details.historyEmpty') }}
        </p>
        <div v-for="h in order.statusHistory" :key="h.id" class="hist-row">
          <span class="muted">{{ formatDate(h.createdAt, 'full', locale) }}</span>
          <span>
            {{ h.fromStatus ? t(`orders.status.${h.fromStatus}`) : '—' }} →
            {{ t(`orders.status.${h.toStatus}`) }}
          </span>
          <span v-if="h.comment" class="muted">{{ h.comment }}</span>
        </div>

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
.btn-mini:disabled {
  opacity: 0.5;
}
.btn-mini.danger {
  border-color: #5b2323;
  color: #e5a3a3;
}
.section {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.75rem 0 0.375rem;
}
.item-line {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 0.8rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid #161c26;
}
.field {
  margin-bottom: 0.5rem;
}
.label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.75;
  margin-bottom: 0.25rem;
}
.input {
  border: 1px solid #161c26;
}
.input::placeholder {
  color: #748092;
}
.muted {
  font-size: 0.75rem;
  opacity: 0.65;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
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
.hist-row {
  font-size: 0.78rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.375rem 0;
  border-bottom: 1px solid #161c26;
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
.error {
  font-size: 0.75rem;
  color: #e5a3a3;
  margin-top: 0.5rem;
}
</style>
