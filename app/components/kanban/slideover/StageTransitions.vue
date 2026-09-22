<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import {useDealSlideStore} from '@/stores/deal-slide.store'
import { useAllowedTransitionsQuery } from '@/components/kanban/useAllowedTransitionsQuery'
import { updateDealStatusApi } from '~/utils/crm.api'
import { getApiErrorMessage } from '~/utils/api'
import { parseMissingDealFields } from '~/utils/deal-move-error'
import type { DealStatus } from '~/types/backend.contracts'

const { t } = useI18n()
const store = useDealSlideStore()
const queryClient = useQueryClient()
const {data: allowedTransitions} = useAllowedTransitionsQuery()

// Цели, разрешённые ТЕКУЩЕМУ пользователю по роли из текущего этапа.
// Проверка полей — на бэкенде при попытке перехода.
const targets = computed(() => {
  const from = store.card?.status
  if (!from) return []
  const list = allowedTransitions.value ?? []
  return [...new Set(list.filter((tr) => tr.fromStage === from).map((tr) => tr.toStage))]
})

const movingTarget = ref<string | null>(null)

watch(() => store.card?.id, () => {
  movingTarget.value = null
})

const {mutate: move, isPending} = useMutation({
  mutationKey: ['change deal stage'],
  mutationFn: async (input: { dealId: string; target: string }) =>
    updateDealStatusApi(input.dealId, input.target as DealStatus),
  onSuccess(_data, input) {
    store.clearPending()
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) {
      queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
      store.card.status = input.target
    }
    movingTarget.value = null
  },
  onError(e, input) {
    // Карточка уже открыта — только подсвечиваем поля из ошибки.
    // Цель запоминаем: перенос повторится сам, когда поля заполнят.
    if (store.card) {
      store.failMove(store.card, parseMissingDealFields(getApiErrorMessage(e)), input.target)
    }
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    movingTarget.value = null
  },
})

function onPick(target: string) {
  if (!store.card || isPending.value) return
  movingTarget.value = target
  move({ dealId: store.card.id, target })
}
</script>

<template>
  <div v-if="store.card && targets.length > 0" class="border-border bg-black/20 rounded p-3 mt-3">
    <div class="uppercase bold text-xl mb-1">
      {{ t('kanban.slideover.transitions') }}
    </div>
    <div class="text-xs text-gray-400 mb-3">
      {{ t('kanban.slideover.currentStage') }}: {{ t('kanban.status.' + store.card.status) }}
    </div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="target in targets"
        :key="target"
        class="btn-target"
        :disabled="isPending"
        @click="onPick(target)"
      >
        {{ t('kanban.status.' + target) }}{{ movingTarget === target && isPending ? '…' : '' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn-target {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.btn-target:hover:not(:disabled) {
  border-color: #482c65;
  color: white;
}
.btn-target:disabled {
  opacity: 0.5;
}
</style>
