<script lang="ts" setup>
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
    title="О сделке"
    description="Информация о сделке"
  >
    <template #body>
      <KanbanSlideoverTop />
      <KanbanSlideoverComments />
    </template>
  </USlideover>
</template>
