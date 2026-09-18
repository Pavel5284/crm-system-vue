<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import {useDealSlideStore} from '@/stores/deal-slide.store'
import { useAllowedTransitionsQuery } from '@/components/kanban/useAllowedTransitionsQuery'
import { updateDealStatusApi } from '~/utils/crm.api'
import type { DealStatus } from '~/types/backend.contracts'

const { t } = useI18n()
const store = useDealSlideStore()
const queryClient = useQueryClient()
const {data: allowedTransitions} = useAllowedTransitionsQuery()

// Цели, разрешённые ТЕКУЩЕМУ пользователю по роли из текущего этапа.
// Проверка полей — на бэкенде при подтверждении.
const targets = computed(() => {
  const from = store.card?.status
  if (!from) return []
  const list = allowedTransitions.value ?? []
  return [...new Set(list.filter((tr) => tr.fromStage === from).map((tr) => tr.toStage))]
})

const selectedTarget = ref<string | null>(null)
const comment = ref('')

watch(() => store.card?.id, () => {
  selectedTarget.value = store.pendingTargetStage
  comment.value = ''
})
watch(() => store.pendingTargetStage, (pending) => {
  if (pending) selectedTarget.value = pending
})

const {mutate: move, isPending} = useMutation({
  mutationKey: ['change deal stage'],
  mutationFn: async (input: { dealId: string; target: string; commentText: string }) =>
    updateDealStatusApi(input.dealId, input.target as DealStatus, input.commentText),
  onSuccess() {
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
    store.clearPending()
    selectedTarget.value = null
    comment.value = ''
  },
})

const canConfirm = computed(() =>
  !!store.card && !!selectedTarget.value && comment.value.trim().length > 0 && !isPending.value,
)

const onConfirm = () => {
  if (!store.card || !selectedTarget.value) return
  const commentText = comment.value.trim()
  if (!commentText) return
  move({ dealId: store.card.id, target: selectedTarget.value, commentText })
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
        :class="{ 'btn-target-active': selectedTarget === target }"
        @click="selectedTarget = target"
      >
        {{ t('kanban.status.' + target) }}
      </button>
    </div>
    <div v-if="selectedTarget" class="mt-3">
      <UiInput
        :placeholder="t('kanban.slideover.commentPlaceholder')"
        v-model="comment"
        type="text"
        class="input"
      />
      <button class="btn-confirm mt-2" :disabled="!canConfirm" @click="onConfirm">
        {{ t('kanban.slideover.confirmMove') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
  margin-bottom: 0.5rem;
}
.input::placeholder {
  color: #748092;
}
.input:focus {
  border-color: #a252c8;
  transition: border-color 0.2s;
}
.btn-target {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.btn-target:hover {
  border-color: #482c65;
  color: white;
}
.btn-target-active {
  border-color: #a252c8;
  color: white;
}
.btn-confirm {
  font-size: 0.75rem;
  border: 1px solid #2c4a2c;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #a3e5a3;
  transition: border-color 0.2s, color 0.2s;
}
.btn-confirm:hover:not(:disabled) {
  border-color: #3a3;
  color: white;
}
.btn-confirm:disabled {
  opacity: 0.5;
}
</style>
