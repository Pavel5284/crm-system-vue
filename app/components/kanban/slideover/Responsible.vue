<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useDealSlideStore } from '@/stores/deal-slide.store'
import { useDealDetailsQuery } from '@/components/kanban/useDealDetailsQuery'
import { updateResponsiblesApi } from '~/utils/crm.api'
import { searchUsersApi } from '~/utils/chat.api'
import { canUpdateDeal } from '~/utils/deal-permissions'
import type { ChatUser } from '~/types/backend.contracts'

const PAGE_LIMIT = 10

const { t } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const dealId = computed(() => store.card?.id ?? null)
const { data: details } = useDealDetailsQuery(dealId)

const canEdit = computed(() => canUpdateDeal(authStore.user.role))
const isHighlighted = computed(() => store.highlightFields.includes('responsible'))

// Текущий состав (источник истины — детали сделки, первый = главный).
const members = computed(() => details.value?.responsibles ?? [])
const memberIds = computed(() => new Set(members.value.map((u) => u.id)))

const isEditing = ref(false)
const search = ref('')
const results = ref<ChatUser[]>([])
const page = ref(1)
const hasMore = ref(false)
const isLoading = ref(false)
const loadError = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const listRef = ref<HTMLElement | null>(null)

function resetEditor() {
  isEditing.value = false
  search.value = ''
  results.value = []
  page.value = 1
  hasMore.value = false
  loadError.value = null
}

watch(() => store.card?.id, resetEditor)

// Подсвеченное пустое поле сразу открываем на заполнение.
watch(() => store.highlightFields, (fields) => {
  if (fields.includes('responsible') && canEdit.value && !isEditing.value && members.value.length === 0) {
    openEditor()
  }
})

async function loadUsers(nextPage: number, append: boolean) {
  if (isLoading.value) return
  isLoading.value = true
  loadError.value = null
  try {
    const batch = await searchUsersApi(search.value.trim(), {
      page: nextPage,
      limit: PAGE_LIMIT,
      includeSelf: true,
    })
    page.value = nextPage
    results.value = append ? [...results.value, ...batch] : batch
    // Бэкенд отдаёт плоский массив: конец списка — неполный батч.
    hasMore.value = batch.length === PAGE_LIMIT
    if (listRef.value && !append) listRef.value.scrollTop = 0
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
    if (!append) results.value = []
  } finally {
    isLoading.value = false
  }
}

function openEditor() {
  resetEditor()
  isEditing.value = true
  void loadUsers(1, false)
}

watch(search, () => {
  if (!isEditing.value) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void loadUsers(1, false), 300)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function onListScroll(e: Event) {
  const el = e.target as HTMLElement
  if (hasMore.value && !isLoading.value && el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
    void loadUsers(page.value + 1, true)
  }
}

const { mutate: save, isPending: isSaving } = useMutation({
  mutationKey: ['update deal responsibles'],
  mutationFn: async (userIds: string[]) => updateResponsiblesApi(store.card!.id, userIds),
  onSuccess() {
    store.clearHighlight('responsible')
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    if (store.card) queryClient.invalidateQueries({ queryKey: ['deal', store.card.id] })
  },
})

function toggle(user: ChatUser) {
  if (!store.card || isSaving.value) return
  const ids = members.value.map((u) => u.id)
  const next = memberIds.value.has(user.id)
    ? ids.filter((id) => id !== user.id)
    : [...ids, user.id]
  save(next)
}
</script>

<template>
  <KanbanSlideoverLabel :label-text="t('kanban.slideover.responsible')">
    <div
      class="rounded px-2 py-1.5 -mx-2"
      :class="{ 'ring-1 ring-red-500/70 bg-red-500/5': isHighlighted }"
    >
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(u, idx) in members"
          :key="u.id"
          class="chip"
        >
          {{ u.name }}
          <span v-if="idx === 0" class="chip-primary">{{ t('kanban.slideover.primaryResponsible') }}</span>
          <button
            v-if="canEdit && isEditing"
            class="chip-x"
            :disabled="isSaving"
            :title="t('common.delete')"
            @click="toggle(u)"
          >
            ×
          </button>
        </span>
        <span v-if="!members.length" class="text-muted-foreground">{{ t('kanban.slideover.notAssigned') }}</span>
      </div>
      <button
        v-if="canEdit && !isEditing"
        class="btn-mini shrink-0"
        @click="openEditor"
      >
        {{ members.length ? t('kanban.slideover.changeResponsible') : t('common.add') }}
      </button>
    </div>
    <div v-if="canEdit && isEditing" class="mt-2">
      <UiInput
        v-model="search"
        :placeholder="t('kanban.slideover.responsibleSearchPlaceholder')"
        type="text"
        class="input"
      />
      <div v-if="loadError" class="error">{{ loadError }}</div>
      <ul
        v-else
        ref="listRef"
        class="mt-1 max-h-48 overflow-y-auto rounded border border-[#161c26]"
        @scroll="onListScroll"
      >
        <li v-for="u in results" :key="u.id">
          <button
            class="user-row"
            :disabled="isSaving"
            @click="toggle(u)"
          >
            <span class="truncate">{{ u.name }}</span>
            <span class="truncate text-gray-500">{{ u.email }}</span>
            <span v-if="memberIds.has(u.id)">✓</span>
          </button>
        </li>
        <li v-if="!results.length && !isLoading" class="hint px-2 py-1.5">
          {{ search.trim() ? t('kanban.slideover.noUsersFound') : t('common.noData') }}
        </li>
        <li v-if="isLoading" class="hint px-2 py-1.5">{{ t('common.loading') }}</li>
      </ul>
      <div class="mt-1 flex items-center gap-2">
        <button class="btn-mini" @click="resetEditor">
          {{ t('common.cancel') }}
        </button>
        <span v-if="isSaving" class="hint">{{ t('kanban.slideover.assigning') }}</span>
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
.input::placeholder {
  color: #748092;
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
.btn-mini:hover {
  border-color: #482c65;
  color: white;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  color: #aebed5;
}
.chip-primary {
  font-size: 0.625rem;
  color: #a252c8;
  text-transform: uppercase;
}
.chip-x {
  color: #748092;
  line-height: 1;
}
.chip-x:hover:not(:disabled) {
  color: white;
}
.chip-x:disabled {
  opacity: 0.5;
}
.user-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: #aebed5;
  text-align: left;
}
.user-row:hover:not(:disabled) {
  background: #161c26;
  color: white;
}
.user-row:disabled {
  opacity: 0.5;
}
.hint {
  font-size: 0.75rem;
  color: #748092;
}
.error {
  font-size: 0.75rem;
  color: #e5a3a3;
}
</style>
