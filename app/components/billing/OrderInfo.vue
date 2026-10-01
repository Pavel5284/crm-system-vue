<script setup lang="ts">
import { orderBadgeClass } from '~/utils/billing-status'
import { formatDate } from '~/utils/formatDate'
import { convertCurrency } from '~/utils/convertCurrency'
import type { OrderDetailsDto } from '~/types/backend.contracts'

defineProps<{
  order: OrderDetailsDto
}>()

const { t, locale } = useI18n()
</script>

<template>
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
</style>
