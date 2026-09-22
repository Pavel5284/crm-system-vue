<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useDealSlideStore, type DealHighlightField } from '@/stores/deal-slide.store'
import { useDealDetailsQuery } from '@/components/kanban/useDealDetailsQuery'
import { updateDealApi } from '~/utils/crm.api'
import { canUpdateDeal } from '~/utils/deal-permissions'

type FieldKey = 'company' | 'description' | 'contactName' | 'contactPhone'

const FIELDS: Array<{
  key: FieldKey
  highlight: DealHighlightField
  labelKey: string
  placeholderKey: string
  hintKey?: string
  min?: number
  textarea?: boolean
}> = [
  { key: 'company', highlight: 'company', labelKey: 'kanban.slideover.company', placeholderKey: 'kanban.createDeal.companyPlaceholder', min: 2 },
  { key: 'description', highlight: 'description', labelKey: 'kanban.slideover.descriptionLabel', placeholderKey: 'kanban.createDeal.descriptionPlaceholder', hintKey: 'kanban.slideover.descriptionHint', min: 10, textarea: true },
  { key: 'contactName', highlight: 'contact', labelKey: 'kanban.slideover.contactName', placeholderKey: 'kanban.slideover.contactName' },
  { key: 'contactPhone', highlight: 'contact', labelKey: 'kanban.slideover.contactPhone', placeholderKey: 'kanban.slideover.contactPhone' },
]

const { t } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const dealId = computed(() => store.card?.id ?? null)
const { data: details } = useDealDetailsQuery(dealId)

const canEdit = computed(() => canUpdateDeal(authStore.user.role))
const isHighlighted = (highlight: DealHighlightField) => store.highlightFields.includes(highlight)

const editingKey = ref<FieldKey | null>(null)
const draft = ref('')

watch(() => store.card?.id, () => {
  editingKey.value = null
  draft.value = ''
})

// Подсвеченное пустое поле сразу открываем на заполнение.
watch(() => store.highlightFields, (fields) => {
  if (!canEdit.value || editingKey.value) return
  const target = FIELDS.find((f) => fields.includes(f.highlight) && !(details.value?.[f.key] ?? '').trim())
  if (target) openEditor(target.key)
})

function fieldValue(key: FieldKey): string {
  return details.value?.[key] ?? ''
}

function openEditor(key: FieldKey) {
  draft.value = fieldValue(key)
  editingKey.value = key
}

const { mutate: save, isPending: isSaving } = useMutation({
  mutationKey: ['update deal fields'],
  mutationFn: async (input: { key: FieldKey; value: string }) =>
    updateDealApi(store.card!.id, { [input.key]: input.value } as Record<FieldKey, string>),
  onSuccess(_data, input) {
    const field = FIELDS.find((f) => f.key === input.key)!
    store.clearHighlight(field.highlight)
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
    editingKey.value = null
  },
})

function minFor(key: FieldKey): number {
  return FIELDS.find((f) => f.key === key)?.min ?? 0
}

const canSave = computed(() => {
  if (!editingKey.value || isSaving.value) return false
  const value = draft.value.trim()
  if (value === fieldValue(editingKey.value).trim()) return false
  return value.length >= minFor(editingKey.value)
})

function onSave() {
  if (!store.card || !editingKey.value || !canSave.value) return
  save({ key: editingKey.value, value: draft.value.trim() })
}
</script>

<template>
  <div class="border-border bg-black/20 rounded p-3 mt-3">
    <div
      v-for="f in FIELDS"
      :key="f.key"
      class="rounded px-2 py-1.5"
      :class="{
        'mb-1': true,
        'ring-1 ring-red-500/70 bg-red-500/5': isHighlighted(f.highlight),
      }"
    >
      <KanbanSlideoverLabel :label-text="t(f.labelKey)">
        <div v-if="editingKey !== f.key" class="flex items-start justify-between gap-2">
          <span class="whitespace-pre-wrap break-words text-sm">{{ fieldValue(f.key).trim() || '—' }}</span>
          <button
            v-if="canEdit"
            class="btn-mini shrink-0"
            @click="openEditor(f.key)"
          >
            {{ t('kanban.slideover.edit') }}
          </button>
        </div>
        <div v-else>
          <textarea
            v-if="f.textarea"
            v-model="draft"
            :placeholder="t(f.placeholderKey)"
            rows="3"
            class="input w-full"
          />
          <UiInput
            v-else
            v-model="draft"
            :placeholder="t(f.placeholderKey)"
            type="text"
            class="input"
          />
          <p v-if="f.hintKey" class="hint">{{ t(f.hintKey) }}</p>
          <div class="mt-1 flex items-center gap-2">
            <button class="btn-mini" :disabled="!canSave" @click="onSave">
              {{ isSaving ? t('common.saving') : t('common.save') }}
            </button>
            <button class="btn-mini" @click="editingKey = null">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </KanbanSlideoverLabel>
    </div>
  </div>
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
}
textarea.input {
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
.hint {
  font-size: 0.75rem;
  color: #748092;
  margin-bottom: 0.25rem;
}
</style>
