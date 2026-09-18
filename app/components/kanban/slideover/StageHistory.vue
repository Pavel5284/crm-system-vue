<script setup lang="ts">
import {useDealSlideStore} from '@/stores/deal-slide.store'
import { formatDate } from '~/utils/formatDate'
import { useDealDetailsQuery } from '@/components/kanban/useDealDetailsQuery'

const { t, locale } = useI18n()
const store = useDealSlideStore()

const dealId = computed(() => store.card?.id ?? null)
const {data: details, isLoading} = useDealDetailsQuery(dealId)
</script>

<template>
  <div class="border-border bg-black/20 rounded p-3 mt-3">
    <div class="uppercase bold text-xl mb-4">
      {{ t('kanban.slideover.history') }}
    </div>
    <div v-if="isLoading" class="text-sm text-muted-foreground">{{ t('kanban.loading') }}</div>
    <div v-else-if="!details?.stageHistory?.length" class="text-sm text-muted-foreground">
      {{ t('kanban.slideover.historyEmpty') }}
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="h in details.stageHistory"
        :key="h.id"
        class="text-sm border-l-2 border-[#a252c8] pl-3"
      >
        <div class="font-medium">
          {{ h.fromStage ? t('kanban.status.' + h.fromStage) : '—' }}
          →
          {{ t('kanban.status.' + h.toStage) }}
        </div>
        <div class="text-xs text-gray-400">
          {{ h.changedBy?.name ?? '—' }} · {{ formatDate(h.createdAt, 'datetime', locale) }}
        </div>
        <div v-if="h.comment" class="mt-1">{{ h.comment }}</div>
      </div>
    </div>
  </div>
</template>
