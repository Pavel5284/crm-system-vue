<script setup lang="ts">
import {
  CUSTOM_UNIT,
  UNIT_CODES,
  type ItemDraft,
} from '~/utils/billing-status'

const { t } = useI18n()

defineProps<{
  modelValue: ItemDraft[]
}>()

const emit = defineEmits<{
  'update:modelValue': [items: ItemDraft[]]
}>()

let nextKey = Date.now()

function addItem(rows: ItemDraft[]) {
  emit('update:modelValue', [
    ...rows,
    {
      key: ++nextKey,
      name: '',
      quantity: 1,
      price: 0,
      unitSelect: '',
      unitCustom: '',
    },
  ])
}

function removeItem(rows: ItemDraft[], key: number) {
  emit('update:modelValue', rows.filter((row) => row.key !== key))
}
</script>

<template>
  <div>
    <div v-for="(row, idx) in modelValue" :key="row.key" class="item-card">
      <div class="item-head">
        <span class="item-num">№{{ idx + 1 }}</span>
        <button
          type="button"
          class="btn-mini danger"
          :title="t('orders.removeItem')"
          @click="removeItem(modelValue, row.key)"
        >
          {{ t('orders.removeItem') }}
        </button>
      </div>
      <UiInput
        v-model="row.name"
        :placeholder="t('orders.itemNamePlaceholder')"
        type="text"
        class="input"
      />
      <div class="item-grid">
        <div>
          <span class="mini-label">{{ t('orders.itemQty') }}</span>
          <UiInput
            v-model="row.quantity"
            type="number"
            min="0.001"
            step="0.001"
            class="input"
          />
        </div>
        <div>
          <span class="mini-label">{{ t('orders.itemPrice') }}</span>
          <UiInput
            v-model="row.price"
            type="number"
            min="0"
            step="0.01"
            class="input"
          />
        </div>
        <div>
          <span class="mini-label">{{ t('orders.itemUnit') }}</span>
          <select v-model="row.unitSelect" class="input w-full">
            <option value="">—</option>
            <option v-for="code in UNIT_CODES" :key="code" :value="code">
              {{ t(`orders.units.${code}`) }}
            </option>
            <option :value="CUSTOM_UNIT">{{ t('orders.unitCustom') }}</option>
          </select>
          <UiInput
            v-if="row.unitSelect === CUSTOM_UNIT"
            v-model="row.unitCustom"
            :placeholder="t('orders.unitCustomPlaceholder')"
            type="text"
            class="input"
          />
        </div>
      </div>
    </div>
    <button type="button" class="add-item" @click="addItem(modelValue)">
      + {{ t('orders.addItem') }}
    </button>
  </div>
</template>

<style scoped>
.item-card {
  border: 1px solid #161c26;
  border-radius: 0.5rem;
  padding: 0.625rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
}
.item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.item-num {
  font-size: 0.75rem;
  opacity: 0.6;
}
.item-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.mini-label {
  display: block;
  font-size: 0.7rem;
  opacity: 0.6;
  margin-bottom: 0.2rem;
}
.add-item {
  width: 100%;
  border: 1px dashed #2a3342;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.add-item:hover {
  border-color: #a252c8;
  color: white;
}
</style>
