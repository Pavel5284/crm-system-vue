<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import type {
  OrderStatusHistoryDto,
  PaymentStatusHistoryDto,
} from '~/types/backend.contracts'

defineProps<{
  items: Array<OrderStatusHistoryDto | PaymentStatusHistoryDto>
  statusI18nPrefix: string
  emptyText: string
}>()

const { t, locale } = useI18n()
</script>

<template>
  <p v-if="!items.length" class="muted">{{ emptyText }}</p>
  <div v-for="h in items" :key="h.id" class="hist-row">
    <span class="muted">{{ formatDate(h.createdAt, 'full', locale) }}</span>
    <span>
      {{ h.fromStatus ? t(`${statusI18nPrefix}.${h.fromStatus}`) : '—' }} →
      {{ t(`${statusI18nPrefix}.${h.toStatus}`) }}
    </span>
    <span v-if="h.changedBy" class="muted">{{ h.changedBy.name }}</span>
    <span v-if="h.comment" class="muted">{{ h.comment }}</span>
  </div>
</template>

<style scoped>
.muted {
  font-size: 0.75rem;
  opacity: 0.65;
}
.hist-row {
  font-size: 0.78rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.375rem 0;
  border-bottom: 1px solid #161c26;
}
</style>
