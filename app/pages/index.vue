<script setup lang="ts">
import {useKanbanQuery} from '@/components/kanban/useKanbanQuery'
import type {ICard, IColumn} from '~/components/kanban/kanban.types'
import dayjs from 'dayjs'
import type {EnumStatus} from "~/types/deals.types"
import { COLLECTION_DEALS, useDbId} from "~/app.constants"
import {getDb} from "~/utils/appwite"

useSeoMeta({
  title: "Home | CRM System"
})

const dragCardRef = ref<ICard | null>(null)
const sourceColumnRef = ref<IColumn | null>(null)

const {data, isLoading, refetch} = useKanbanQuery()

onMounted(() => {
  refetch()
})

type TypeMutationVariables = {
  docId: string
  status?: EnumStatus
}
const DB_ID = useDbId()
const {mutate} = useMutation({
  mutationKey: ['move card'],
  mutationFn: ({docId, status}: TypeMutationVariables) =>{
  const DB = getDb()
  return DB.updateDocument(DB_ID, COLLECTION_DEALS, docId, {
    status
  })},
  onSuccess: () => {
    refetch()
  }
})

function onDragStart(event: DragEvent, card: ICard, column: IColumn) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({ card, columnId: column.id }))
  }
  dragCardRef.value = card
  sourceColumnRef.value = column
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent, targetColumn: IColumn) {
  event.preventDefault()
  if (dragCardRef.value && sourceColumnRef.value) {
    mutate({docId: dragCardRef.value.id, status: targetColumn.id})
    dragCardRef.value = null
    sourceColumnRef.value = null
  }
}

function onCardDragStart(event: DragEvent, card: ICard, column: IColumn) {
  onDragStart(event, card, column)
}

</script>

<template>
  <div class="mb-5">
    <h1 class="text-2xl font-bold">Kilka CRM</h1>
  </div>
  <div v-if="isLoading">Loading...</div>
  <div v-else>
    <div class="grid grid-cols-5 gap-16">
      <div v-for="column in data"
           :key="column.id"
           @dragover="onDragOver"
           @drop="onDrop($event, column)"
      >
        <div class="rounded bg-slate-700 py-1 px-5 mb-2 text-center">
          {{ column.name }}
        </div>
        <KanbanCreateDeal :refetch="refetch" :status="column.id"/>
<UiCard v-for="card in column.items"
                :key="card.id"
                class="mb-3"
                draggable="true"
                @dragstart="onCardDragStart($event, card, column)"
>
          <UiCardHeader role="button">
            <UiCardTitle>
              {{ card.name }}
            </UiCardTitle>
            <UiCardDescription class="mt-2 block">
              {{ convertCurrency(card.price) }}
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="text-xs">Компания: {{ card.companyName }}</UiCardContent>
          <UiCardFooter>{{ dayjs(card.$createdAt).format('DD MMMM YYYY') }}</UiCardFooter>
        </UiCard>
      </div>
    </div>
  </div>
</template>
