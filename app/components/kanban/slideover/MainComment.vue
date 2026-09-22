<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useDealSlideStore } from '@/stores/deal-slide.store'
import { useDealDetailsQuery } from '@/components/kanban/useDealDetailsQuery'
import { updateMainCommentApi } from '~/utils/crm.api'
import { canEditMainComment } from '~/utils/deal-permissions'

const { t } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const dealId = computed(() => store.card?.id ?? null)
const { data: details } = useDealDetailsQuery(dealId)

const canEdit = computed(() => canEditMainComment(authStore.user.role))

const isEditing = ref(false)
const text = ref('')

watch(() => store.card?.id, () => {
  isEditing.value = false
  text.value = ''
})

function openEditor() {
  text.value = details.value?.mainComment ?? ''
  isEditing.value = true
}

const { mutate: save, isPending: isSaving } = useMutation({
  mutationKey: ['update deal main comment'],
  mutationFn: async (comment: string) => updateMainCommentApi(store.card!.id, comment),
  onSuccess() {
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
    isEditing.value = false
  },
})

const canSave = computed(() => (text.value ?? '').trim() !== (details.value?.mainComment ?? '') && !isSaving.value)

function onSave() {
  if (!store.card || !canSave.value) return
  save(text.value ?? '')
}
</script>

<template>
  <KanbanSlideoverLabel :label-text="t('kanban.slideover.mainComment')">
    <div class="flex items-start justify-between gap-2">
      <span class="whitespace-pre-wrap break-words">{{ details?.mainComment || t('kanban.slideover.noMainComment') }}</span>
      <button
        v-if="canEdit && !isEditing"
        class="btn-mini shrink-0"
        @click="openEditor"
      >
        {{ details?.mainComment ? t('kanban.slideover.changeMainComment') : t('common.add') }}
      </button>
    </div>
    <div v-if="canEdit && isEditing" class="mt-2">
      <textarea
        v-model="text"
        :placeholder="t('kanban.slideover.mainCommentPlaceholder')"
        rows="3"
        class="input w-full"
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
  </KanbanSlideoverLabel>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  background: transparent;
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
  color: inherit;
  resize: vertical;
}
.input::placeholder {
  color: #748092;
}
.input:focus {
  border-color: #a252c8;
  outline: none;
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
