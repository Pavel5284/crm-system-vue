<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { getApiErrorMessage } from '~/utils/api'
import { createOrderApi } from '~/utils/billing.api'
import { getCustomersApi, getDealsApi } from '~/utils/crm.api'
import {
  toOrderItemPayload,
  type ItemDraft,
} from '~/utils/billing-status'
import BillingItemsEditor from '~/components/billing/ItemsEditor.vue'
import type { OrderListDto } from '~/types/backend.contracts'

const { t } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const props = defineProps<{
  dealId?: string | null
}>()

const emit = defineEmits<{
  created: [order: OrderListDto]
}>()

const isOpen = ref(false)
const mode = ref<'deal' | 'manual'>(props.dealId ? 'deal' : 'manual')
const selectedDealId = ref(props.dealId ?? '')
const selectedCustomerId = ref('')
const totalInput = ref('')
const comment = ref('')
const error = ref('')

const items = ref<ItemDraft[]>([])

watch(
  () => props.dealId,
  (dealId) => {
    if (dealId) {
      mode.value = 'deal'
      selectedDealId.value = dealId
    }
  },
)

const { data: dealsData } = useQuery({
  queryKey: ['deals'],
  queryFn: () => getDealsApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth && isOpen.value),
})
const { data: customersData } = useQuery({
  queryKey: ['customers'],
  queryFn: () => getCustomersApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth && isOpen.value),
})

const deals = computed(() => dealsData.value ?? [])
const customers = computed(() => customersData.value ?? [])

const selectedDeal = computed(() =>
  deals.value.find((d) => d.id === selectedDealId.value),
)

// если позиции заполнены - итог из них
const namedItems = computed(() => items.value.filter((row) => row.name.trim()))

const itemsSum = computed(() => {
  const raw = namedItems.value.reduce(
    (sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 0),
    0,
  )
  return Math.round((raw + Number.EPSILON) * 100) / 100
})

const hasItems = computed(() => namedItems.value.length > 0)

// с позициями ручной ввод суммы лочим
watch(
  [itemsSum, hasItems],
  ([sum, withItems]) => {
    if (withItems) totalInput.value = String(sum)
  },
  { immediate: true },
)

// при открытии подставляем цену сделки, если позиций еще нет
watch([isOpen, selectedDealId, () => deals.value], ([open]) => {
  if (!open || mode.value !== 'deal' || namedItems.value.length) return
  if (totalInput.value) return
  const deal = selectedDeal.value
  if (deal) totalInput.value = String(deal.price)
})

function open() {
  error.value = ''
  comment.value = ''
  if (!props.dealId) {
    mode.value = 'manual'
    selectedDealId.value = ''
    totalInput.value = ''
  } else {
    mode.value = 'deal'
    selectedDealId.value = props.dealId
    totalInput.value = ''
  }
  items.value = []
  isOpen.value = true
}

defineExpose({ open })

const canSubmit = computed(() => {
  if (isPending.value) return false
  if (mode.value === 'deal' && !selectedDealId.value) return false
  if (mode.value === 'manual' && !selectedCustomerId.value) return false
  const total = totalInput.value.trim()
  if (total !== '' && !(Number(total) >= 0)) return false
  // пустые строки без названия не считаем
  if (total === '' && !namedItems.value.length) return false
  for (const row of namedItems.value) {
    if (!(Number(row.quantity) > 0) || !(Number(row.price) >= 0)) return false
  }
  return true
})

const { mutate, isPending } = useMutation({
  mutationKey: ['create order'],
  mutationFn: () => {
    const payload: Parameters<typeof createOrderApi>[0] = {}
    if (mode.value === 'deal') payload.dealId = selectedDealId.value
    else payload.customerId = selectedCustomerId.value
    const trimmedComment = comment.value.trim()
    if (trimmedComment) payload.comment = trimmedComment
    // бэк сам посчитает итог из позиций
    const rows = toOrderItemPayload(items.value)
    if (rows.length) {
      payload.items = rows
    } else {
      const total = totalInput.value.trim()
      if (total !== '') payload.total = Number(total)
    }
    return createOrderApi(payload)
  },
  onSuccess(order) {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    emit('created', order)
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
    :title="t('orders.createTitle')"
  >
    <template #body>
      <BillingDialogShell
        :error="error"
        :submit-disabled="!canSubmit"
        :submit-pending="isPending"
        :idle-text="t('common.create')"
        :pending-text="t('orders.creating')"
        @submit="mutate()"
      >
        <div v-if="!props.dealId" class="mode-switch">
        <button
          type="button"
          :class="{ active: mode === 'deal' }"
          @click="mode = 'deal'"
        >
          {{ t('orders.sourceDeal') }}
        </button>
        <button
          type="button"
          :class="{ active: mode === 'manual' }"
          @click="mode = 'manual'"
        >
          {{ t('orders.sourceCustomer') }}
        </button>
      </div>

      <div v-if="mode === 'deal'" class="field">
        <label class="label">{{ t('orders.sourceDeal') }}</label>
        <select
          v-model="selectedDealId"
          :disabled="!!props.dealId"
          class="input w-full"
        >
          <option value="" disabled hidden>{{ t('orders.sourceDeal') }}</option>
          <option v-for="d in deals" :key="d.id" :value="d.id">
            {{ d.name }} · {{ d.customer.name }}
          </option>
        </select>
      </div>

      <div v-else class="field">
        <label class="label">{{ t('orders.sourceCustomer') }}</label>
        <select v-model="selectedCustomerId" class="input w-full">
          <option value="" disabled hidden>{{ t('orders.sourceCustomer') }}</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">
            {{ c.name }} · {{ c.email }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="label">{{ t('orders.total') }}</label>
        <UiInput
          v-model="totalInput"
          type="number"
          min="0"
          step="0.01"
          class="input"
          :disabled="hasItems"
        />
        <p v-if="hasItems" class="hint">{{ t('orders.totalFromItems') }}</p>
      </div>

      <div class="field">
        <label class="label">{{ t('orders.items') }}</label>
        <BillingItemsEditor v-model="items" />
      </div>

      <div class="field">
        <label class="label">{{ t('orders.comment') }}</label>
        <UiInput
          v-model="comment"
          :placeholder="t('orders.commentPlaceholder')"
          type="text"
          class="input"
        />
      </div>
      </BillingDialogShell>
    </template>
  </USlideover>
</template>

<style scoped>
.mode-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.mode-switch button {
  flex: 1;
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
}
.mode-switch button.active {
  border-color: #a252c8;
  color: white;
}
.hint {
  font-size: 0.75rem;
  color: #748092;
  margin-top: 0.25rem;
}
</style>
