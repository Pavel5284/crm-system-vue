<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import {useDealSlideStore} from '@/stores/deal-slide.store'
import { formatDate } from '~/utils/formatDate'
import { deleteDealApi } from '~/utils/crm.api'
import { canDeleteDeal } from '~/utils/deal-permissions'

const { t, locale } = useI18n()
const store = useDealSlideStore()
const authStore = useAuthStore()
const queryClient = useQueryClient()

const confirmDelete = ref(false)
watch(() => store.card?.id, () => {
  confirmDelete.value = false
})

const {mutate: removeDeal, isPending: isDeleting} = useMutation({
  mutationKey: ['delete deal'],
  mutationFn: async (id: string) => deleteDealApi(id),
  onSuccess() {
    queryClient.invalidateQueries({ queryKey: ['deals'] })
    store.clear()
  },
})

const onDeleteClick = () => {
  if (!store.card) return
  removeDeal(store.card.id)
}

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
    <KanbanSlideoverResponsible />
    <KanbanSlideoverDeadline />
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.company')">
      {{ store.card?.customerName }}
    </KanbanSlideoverLabel>
    <KanbanSlideoverLabel :label-text="t('kanban.slideover.createdAt')">
      {{ formatDate(store.card?.createdAt, 'short', locale) }}
    </KanbanSlideoverLabel>
    <div v-if="store.card && canDeleteDeal(authStore.user.role)" class="mt-4">
      <button
        v-if="!confirmDelete"
        class="btn-danger"
        @click="confirmDelete = true"
      >
        {{ t('kanban.slideover.deleteButton') }}
      </button>
      <div v-else class="confirm-box">
        <p>{{ t('kanban.slideover.deleteConfirmText') }}</p>
        <div class="confirm-actions">
          <button class="btn-danger" :disabled="isDeleting" @click="onDeleteClick">
            {{ t('kanban.slideover.deleteConfirm') }}
          </button>
          <button class="btn-mini" @click="confirmDelete = false">
            {{ t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-danger {
  font-size: 0.75rem;
  border: 1px solid #5b2323;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #e5a3a3;
  transition: border-color 0.2s, color 0.2s;
}
.btn-danger:hover:not(:disabled) {
  border-color: #a33;
  color: white;
}
.btn-danger:disabled {
  opacity: 0.5;
}
</style>
