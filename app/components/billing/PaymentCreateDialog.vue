<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { getApiErrorMessage } from '~/utils/api'
import { createPaymentApi, getOrdersApi } from '~/utils/billing.api'
import type { PaymentDto, PaymentMethod } from '~/types/backend.contracts'

const { t } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const emit = defineEmits<{
  created: [payment: PaymentDto]
}>()

const isOpen = ref(false)
// Предвыбранный заказ (из карточки заказа). Пусто — выбор внутри диалога.
const presetOrder = ref('')
const orderId = ref('')
const orderLabel = ref('')
const amountInput = ref('')
const method = ref<PaymentMethod>('TRANSFER')
const instantConfirm = ref(true)
const comment = ref('')
const error = ref('')

const METHODS: PaymentMethod[] = ['TRANSFER', 'CARD', 'CASH', 'SBP', 'OTHER']

const { data: ordersData } = useQuery({
  queryKey: ['orders'],
  queryFn: () => getOrdersApi(),
  refetchInterval: false,
  enabled: computed(() => isOpen.value && !presetOrder.value && authStore.isAuth),
})

const selectedOrder = computed(() =>
  (ordersData.value ?? []).find((o) => o.id === orderId.value),
)

// Подставляем остаток выбранного заказа, пока сумму не ввели вручную.
watch(orderId, () => {
  if (amountInput.value.trim()) return
  const remaining = selectedOrder.value?.remaining
  if (remaining !== undefined && remaining > 0) {
    amountInput.value = String(remaining)
  }
})

function open(input?: { orderId?: string; orderLabel?: string; remaining?: number }) {
  presetOrder.value = input?.orderId ?? ''
  orderId.value = input?.orderId ?? ''
  orderLabel.value = input?.orderLabel ?? ''
  amountInput.value =
    input?.remaining !== undefined && input.remaining > 0
      ? String(input.remaining)
      : ''
  method.value = 'TRANSFER'
  instantConfirm.value = true
  comment.value = ''
  error.value = ''
  isOpen.value = true
}

defineExpose({ open })

const canSubmit = computed(() => {
  if (isPending.value || !orderId.value) return false
  return Number(amountInput.value) > 0
})

const { mutate, isPending } = useMutation({
  mutationKey: ['create payment'],
  mutationFn: () =>
    createPaymentApi({
      orderId: orderId.value,
      amount: Number(amountInput.value),
      method: method.value,
      ...(instantConfirm.value ? { status: 'SUCCEEDED' as const } : {}),
      ...(comment.value.trim() ? { comment: comment.value.trim() } : {}),
    }),
  onSuccess(payment) {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['order', orderId.value] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    emit('created', payment)
    isOpen.value = false
  },
  onError(e) {
    error.value = getApiErrorMessage(e)
  },
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    side="right"
    :title="t('payments.createTitle')"
  >
    <template #body>
      <BillingDialogShell
        :error="error"
        :submit-disabled="!canSubmit"
        :submit-pending="isPending"
        :idle-text="t('common.create')"
        :pending-text="t('payments.creating')"
        @submit="mutate()"
      >
        <p v-if="orderLabel" class="order-label">{{ orderLabel }}</p>

      <div v-if="!presetOrder" class="field">
        <label class="label">{{ t('payments.order') }}</label>
        <select v-model="orderId" class="input w-full">
          <option value="" disabled hidden>{{ t('payments.order') }}</option>
          <option v-for="o in (ordersData ?? [])" :key="o.id" :value="o.id">
            №{{ o.number }} · {{ o.customerName }} · {{ o.total }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="label">{{ t('payments.amount') }}</label>
        <UiInput
          v-model="amountInput"
          type="number"
          min="0.01"
          step="0.01"
          class="input"
        />
      </div>

      <div class="field">
        <label class="label">{{ t('payments.method') }}</label>
        <select v-model="method" class="input w-full">
          <option v-for="m in METHODS" :key="m" :value="m">
            {{ t(`payments.methodNames.${m}`) }}
          </option>
        </select>
      </div>

      <label class="check">
        <input v-model="instantConfirm" type="checkbox" />
        {{ t('payments.actions.confirm') }}
      </label>

      <div class="field">
        <UiInput
          v-model="comment"
          :placeholder="t('payments.commentPlaceholder')"
          type="text"
          class="input"
        />
      </div>
      </BillingDialogShell>
    </template>
  </USlideover>
</template>

<style scoped>
.order-label {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-bottom: 0.75rem;
}
.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
}
</style>
