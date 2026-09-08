<script setup lang="ts">
import {useDealSlideStore} from '@/stores/deal-slide.store'
import { formatDate } from '~/utils/formatDate'

const { t, locale } = useI18n()
const store = useDealSlideStore()

</script>

<template>
  <div class="border-border bg-black/20 rounded p-3">
    <div class="uppercase bold text-xl mb-4">
      {{ t('kanban.slideover.aboutDeal') }}
    </div>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.name')">
      <h2>
        {{ store.card?.name }}
      </h2>
    </KanbanSlideoverLabel>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.price')">
      {{ convertCurrency(store.card?.price || 0, locale) }}
    </KanbanSlideoverLabel>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.status')">
      <UiBadge variant="outline">
        {{ store.card?.status }}
      </UiBadge>
    </KanbanSlideoverLabel>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.company')">
      {{ store.card?.companyName }}
    </KanbanSlideoverLabel>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.createdAt')">
      {{ formatDate(store.card?.createdAt, 'short', locale) }}
    </KanbanSlideoverLabel>
  </div>
</template>

