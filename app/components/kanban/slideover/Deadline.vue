<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useDealSlideStore } from '@/stores/deal-slide.store'
import { useDealDetailsQuery } from '@/components/kanban/useDealDetailsQuery'
import { updateDealApi } from '~/utils/crm.api'
import { canUpdateDeal } from '~/utils/deal-permissions'
import { formatDate } from '~/utils/formatDate'

const { t, locale } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const dealId = computed(() => store.card?.id ?? null)
const { data: details } = useDealDetailsQuery(dealId)

const canEdit = computed(() => canUpdateDeal(authStore.user.role))
const isHighlighted = computed(() => store.highlightFields.includes('deadline'))

const isEditing = ref(false)
const date = ref('')

watch(() => store.card?.id, () => {
  isEditing.value = false
  date.value = ''
})

// Подсвеченную пустую дату сразу открываем на заполнение.
watch(() => store.highlightFields, (fields) => {
  if (fields.includes('deadline') && canEdit.value && !isEditing.value && !details.value?.deadline) {
    openEditor()
  }
})

function openEditor() {
  date.value = (details.value?.deadline ?? '').slice(0, 10)
  isEditing.value = true
}

const { mutate: save, isPending: isSaving } = useMutation({
  mutationKey: ['update deal deadline'],
  mutationFn: async (day: string) => updateDealApi(store.card!.id, { deadline: day }),
  onSuccess() {
    store.clearHighlight('deadline')
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
    isEditing.value = false
  },
})

const currentDay = computed(() => (details.value?.deadline ?? '').slice(0, 10))
const canSave = computed(() => !!date.value && date.value !== currentDay.value && !isSaving.value)

function onSave() {
  if (!store.card || !canSave.value) return
  save(date.value)
}
</script>

<template>
  <KanbanSlideoverLabel :label-text="t('kanban.slideover.deadline')">
    <div
      class="rounded px-2 py-1.5 -mx-2"
      :class="{ 'ring-1 ring-red-500/70 bg-red-500/5': isHighlighted }"
    >
    <div class="flex items-center justify-between gap-2">
      <span>{{ details?.deadline ? formatDate(details.deadline, 'short', locale) : t('kanban.slideover.noDeadline') }}</span>
      <button
        v-if="canEdit && !isEditing"
        class="btn-mini"
        @click="openEditor"
      >
        {{ t('kanban.slideover.changeDeadline') }}
      </button>
    </div>
    <div v-if="canEdit && isEditing" class="mt-2">
      <UiInput
        v-model="date"
        type="date"
        class="input"
      />
      <div class="mt-1 flex items-center gap-2">
        <button class="btn-mini" :disabled="!canSave" @click="onSave">
          {{ isSaving ? t('common.saving') : t('common.save') }}
        </button>
        <button class="btn-mini" @click="isEditing = false">
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
    </div>
  </KanbanSlideoverLabel>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
  margin-bottom: 0.5rem;
}
.input:focus {
  border-color: #a252c8;
  transition: border-color 0.2s;
}
.btn-mini {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
}
.btn-mini:hover:not(:disabled) {
  border-color: #482c65;
  color: white;
}
.btn-mini:disabled {
  opacity: 0.5;
}
</style>
