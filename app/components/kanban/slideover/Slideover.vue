<script lang="ts" setup>
const { t } = useI18n()
const store = useDealSlideStore()

const isLocalOpen = computed({
  get: () => store.isOpen,
  set: value => {
    store.isOpen = value
  }
})
</script>

<template>
  <USlideover
    v-model:open="isLocalOpen"
    side="right"
    :title="t('kanban.slideover.title')"
    :description="t('kanban.slideover.description')"
  >
    <template #body>
      <KanbanSlideoverTop />
      <KanbanSlideoverMainComment />
      <KanbanSlideoverDealFields />
      <KanbanSlideoverStageTransitions />
      <KanbanSlideoverStageHistory />
      <KanbanSlideoverComments />
    </template>
  </USlideover>
</template>

