<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { getApiErrorMessage } from '~/utils/api'
import { createOrderApi } from '~/utils/billing.api'
import { getCustomersApi, getDealsApi } from '~/utils/crm.api'
import type { OrderItemInput, OrderListDto } from '~/types/backend.contracts'

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

interface ItemRow extends OrderItemInput {
  key: number
}
let itemKey = 0
const items = ref<ItemRow[]>([])

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

// Сумма позиций — подсказка для ручного total.
const itemsSum = computed(() =>
  items.value.reduce(
    (sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 0),
    0,
  ),
)

// Предзаполнение суммы из сделки при открытии / смене сделки.
watch([isOpen, selectedDealId, () => deals.value], ([open]) => {
  if (!open || mode.value !== 'deal') return
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

function addItem() {
  items.value.push({ key: ++itemKey, name: '', quantity: 1, unit: '', price: 0 })
}

function removeItem(key: number) {
  items.value = items.value.filter((row) => row.key !== key)
}

const canSubmit = computed(() => {
  if (isPending.value) return false
  if (mode.value === 'deal' && !selectedDealId.value) return false
  if (mode.value === 'manual' && !selectedCustomerId.value) return false
  const total = totalInput.value.trim()
  if (total !== '' && !(Number(total) >= 0)) return false
  for (const row of items.value) {
    if (!row.name.trim()) return false
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
    const total = totalInput.value.trim()
    if (total !== '') payload.total = Number(total)
    const trimmedComment = comment.value.trim()
    if (trimmedComment) payload.comment = trimmedComment
    const rows = items.value
      .filter((row) => row.name.trim())
      .map(({ name, quantity, unit, price }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        ...(unit?.trim() ? { unit: unit.trim() } : {}),
        price: Number(price),
      }))
    if (rows.length) payload.items = rows
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
          <option value="" disabled>{{ t('orders.sourceDeal') }}</option>
          <option v-for="d in deals" :key="d.id" :value="d.id">
            {{ d.name }} · {{ d.customer.name }}
          </option>
        </select>
      </div>

      <div v-else class="field">
        <label class="label">{{ t('orders.sourceCustomer') }}</label>
        <select v-model="selectedCustomerId" class="input w-full">
          <option value="" disabled>{{ t('orders.sourceCustomer') }}</option>
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
        />
        <p v-if="itemsSum > 0" class="hint">
          {{ t('orders.items') }}: {{ itemsSum }}
        </p>
      </div>

      <div class="field">
        <div class="row-between">
          <label class="label">{{ t('orders.items') }}</label>
          <button type="button" class="btn-mini" @click="addItem">
            {{ t('orders.addItem') }}
          </button>
        </div>
        <div v-for="row in items" :key="row.key" class="item-row">
          <UiInput
            v-model="row.name"
            :placeholder="t('orders.itemNamePlaceholder')"
            type="text"
            class="input grow"
          />
          <UiInput
            v-model="row.quantity"
            :title="t('orders.itemQty')"
            type="number"
            min="0.001"
            step="0.001"
            class="input w-20"
          />
          <UiInput
            v-model="row.price"
            :title="t('orders.itemPrice')"
            type="number"
            min="0"
            step="0.01"
            class="input w-24"
          />
          <button
            type="button"
            class="btn-mini danger"
            @click="removeItem(row.key)"
          >
            ✕
          </button>
        </div>
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

      <p v-if="error" class="error">{{ error }}</p>

      <UiButton type="button" :disabled="!canSubmit" @click="mutate()">
        {{ isPending ? t('orders.creating') : t('common.create') }}
      </UiButton>
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
.field {
  margin-bottom: 0.75rem;
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
.hint {
  font-size: 0.75rem;
  color: #748092;
  margin-top: 0.25rem;
}
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}
.item-row {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  margin-bottom: 0.375rem;
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
.error {
  font-size: 0.75rem;
  color: #e5a3a3;
  margin-bottom: 0.5rem;
}
</style>
