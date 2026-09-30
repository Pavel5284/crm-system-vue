<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import type { OrderDetailsDto } from '~/types/backend.contracts'

const { t, locale } = useI18n()

defineProps<{
  order: OrderDetailsDto | null
}>()

function print() {
  window.print()
}

// Коды из селекта (`orders.units.*`) — в локализованную подпись,
// старые произвольные строки из БД — как есть.
function unitText(unit: string | null): string {
  if (!unit) return ''
  const key = `orders.units.${unit}`
  const label = t(key)
  return label !== key ? ` ${label}` : ` ${unit}`
}
</script>

<template>
  <div>
    <div v-if="order" class="invoice-print">
      <h2 class="inv-title">{{ t('orders.invoice.title') }} №{{ order.number }}</h2>
      <p class="inv-meta">
        {{ t('orders.invoice.date') }}: {{ formatDate(order.createdAt, 'short', locale) }}
      </p>
      <div class="inv-parties">
        <p>
          <strong>{{ t('orders.invoice.to') }}:</strong>
          {{ order.customer.name }} ({{ order.customer.email }})
        </p>
        <p v-if="order.deal">
          <strong>{{ t('orders.invoice.deal') }}:</strong> {{ order.deal.name }}
        </p>
      </div>

      <table v-if="order.items.length" class="inv-table">
        <thead>
          <tr>
            <th>{{ t('orders.invoice.item') }}</th>
            <th>{{ t('orders.invoice.qty') }}</th>
            <th>{{ t('orders.invoice.price') }}</th>
            <th>{{ t('orders.invoice.sum') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in order.items" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}{{ unitText(item.unit) }}</td>
            <td>{{ convertCurrency(item.price, locale) }}</td>
            <td>{{ convertCurrency(item.lineTotal, locale) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="inv-totals">
        <p>
          <strong>{{ t('orders.invoice.total') }}:</strong>
          {{ convertCurrency(order.total, locale) }}
        </p>
        <p>
          <strong>{{ t('orders.invoice.paid') }}:</strong>
          {{ convertCurrency(order.paid, locale) }}
        </p>
        <p>
          <strong>{{ t('orders.invoice.remaining') }}:</strong>
          {{ convertCurrency(order.remaining, locale) }}
        </p>
      </div>

      <p v-if="order.comment" class="inv-comment">
        <strong>{{ t('orders.invoice.comment') }}:</strong> {{ order.comment }}
      </p>
    </div>

    <div class="inv-actions">
      <UiButton type="button" @click="print">
        {{ t('orders.invoice.print') }}
      </UiButton>
    </div>
  </div>
</template>

<style scoped>
.inv-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.inv-meta {
  font-size: 0.8rem;
  opacity: 0.75;
  margin-bottom: 0.75rem;
}
.inv-parties {
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.inv-table {
  width: 100%;
  font-size: 0.8rem;
  border-collapse: collapse;
  margin-bottom: 0.75rem;
}
.inv-table th,
.inv-table td {
  border: 1px solid #2a3342;
  padding: 0.375rem 0.5rem;
  text-align: left;
}
.inv-totals {
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}
.inv-comment {
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
}
.inv-actions {
  margin-top: 0.5rem;
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .invoice-print,
  .invoice-print * {
    visibility: visible;
  }
  .invoice-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 24px;
    background: white;
    color: black;
  }
}
</style>
