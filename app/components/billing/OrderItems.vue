<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { getApiErrorMessage } from '~/utils/api'
import {
  CUSTOM_UNIT,
  UNIT_CODES,
  toOrderItemPayload,
  type ItemDraft,
} from '~/utils/billing-status'
import BillingItemsEditor from '~/components/billing/ItemsEditor.vue'
import { updateOrderApi } from '~/utils/billing.api'
import { canUpdateOrder } from '~/utils/billing-permissions'
import type { OrderDetailsDto } from '~/types/backend.contracts'

const props = defineProps<{
  order: OrderDetailsDto
  role: string | null | undefined
}>()

const { t } = useI18n()
const queryClient = useQueryClient()

// Правка заказа (только DRAFT/CONFIRMED — как на бэкенде).
// Позиции заменяются целиком, итог бэкенд пересчитает сам.
const canEditOrder = computed(
  () =>
    canUpdateOrder(props.role) &&
    (props.order.status === 'DRAFT' || props.order.status === 'CONFIRMED'),
)

const editing = ref(false)
const editComment = ref('')
const editItems = ref<ItemDraft[]>([])
const editError = ref('')

// Слайдовер может переиспользовать компонент для другого заказа
// без размонтирования — сбрасываем черновик при смене заказа.
watch(
  () => props.order.id,
  () => {
    editing.value = false
    editError.value = ''
  },
)

function unitToDraft(unit: string | null): Pick<ItemDraft, 'unitSelect' | 'unitCustom'> {
  if (!unit) return { unitSelect: '', unitCustom: '' }
  if ((UNIT_CODES as readonly string[]).includes(unit))
    return { unitSelect: unit, unitCustom: '' }
  return { unitSelect: CUSTOM_UNIT, unitCustom: unit }
}

function startEdit() {
  editing.value = true
  editError.value = ''
  editComment.value = props.order.comment ?? ''
  editItems.value = props.order.items.map((item, idx) => ({
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
    updateOrderApi(props.order.id, {
      comment: editComment.value,
      items: toOrderItemPayload(editItems.value),
    }),
  onSuccess() {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
    queryClient.invalidateQueries({ queryKey: ['order', props.order.id] })
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
</script>

<template>
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
    <button
      v-if="canEditOrder"
      class="btn-mini mt-1"
      @click="startEdit"
    >
      {{ t('orders.actions.edit') }}
    </button>
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
</template>

<style scoped>
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
.muted {
  font-size: 0.75rem;
  opacity: 0.65;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}
</style>
