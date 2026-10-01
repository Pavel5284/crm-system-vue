<script setup lang="ts">
import type { ICard } from '~/components/kanban/kanban.types'
import { formatDate } from '~/utils/formatDate'
import { convertCurrency } from '~/utils/convertCurrency'

const props = defineProps<{
  card: ICard
}>()

const emit = defineEmits<{
  open: [card: ICard]
}>()

const { t, locale } = useI18n()

function isCardOverdue(card: ICard): boolean {
  if (!card.deadline || card.status === 'done') return false
  return new Date(card.deadline).getTime() < Date.now()
}

const overdue = computed(() => isCardOverdue(props.card))
</script>

<template>
  <UiCard
    class="transition-shadow hover:shadow-md"
    :class="{ 'border-red-500/60': overdue }"
    role="button"
    @click="emit('open', card)"
  >
    <UiCardHeader>
      <UiCardTitle>{{ card.name }}</UiCardTitle>
      <UiCardDescription class="mt-2 block">{{ convertCurrency(card.price, locale) }}</UiCardDescription>
    </UiCardHeader>
    <UiCardContent class="text-xs">{{ t('kanban.company') }}: {{ card.customerName }}</UiCardContent>
    <UiCardContent class="text-xs">{{ t('kanban.responsible') }}: {{ card.responsibleName ?? '—' }}</UiCardContent>
    <UiCardContent class="text-xs" :class="{ 'text-red-400 font-medium': overdue }">
      {{ t('kanban.deadline') }}: {{ card.deadline ? formatDate(card.deadline, 'short', locale) : '—' }}
    </UiCardContent>
    <UiCardFooter>{{ formatDate(card.createdAt, 'long', locale) }}</UiCardFooter>
    <slot name="actions" />
  </UiCard>
</template>
