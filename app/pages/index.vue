<script setup lang="ts">
import {useKanbanQuery} from '@/components/kanban/useKanbanQuery'
import type {ICard, IColumn} from '~/components/kanban/kanban.types'
useSeoMeta({
  title: "Home | CRM System"
})

const dragCardRef = ref<ICard | null>(null)
const sourceColumnRef = ref<IColumn | null>(null)

useKanbanQuery()
</script>

<template>
  <div class="mb-5">
    <h1 class="text-2xl font-bold">Kilka CRM</h1>
  </div>
  <div>
    <UiCard class="mb-3" draggable="true">
      <UiCardHeader role="button">name card</UiCardHeader>
      <UiCardContent>Компания</UiCardContent>
      <UiCardFooter>Date</UiCardFooter>
    </UiCard>
  </div>
</template>
