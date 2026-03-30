<script setup lang="ts">
import {useKanbanQuery} from '@/components/kanban/useKanbanQuery'
import type {ICard, IColumn} from '~/components/kanban/kanban.types'
import dayjs from 'dayjs'

useSeoMeta({
  title: "Home | CRM System"
})

const dragCardRef = ref<ICard | null>(null)
const sourceColumnRef = ref<IColumn | null>(null)

const {data, isLoading, refetch} = useKanbanQuery()

onMounted(() => {
  refetch()
})
console.log(data, "data")
</script>

<template>
  <div class="mb-5">
    <h1 class="text-2xl font-bold">Kilka CRM</h1>
  </div>
  <div v-if="isLoading">Loading...</div>
  <div v-else>
    <div class="grid grid-cols-5 gap-16">
      <div v-for="(column, index) in data"
           :key="column.id"
      >
        <div class="rounded bg-slate-700 py-1 px-5 mb-2 text-center">
          {{ column.name }}
        </div>

        <UiCard v-for="card in column.items"
                :key="card.id"
                class="mb-3"
                draggable="true"
        >
          <UiCardHeader role="button">
            <UiCardTitle>
              {{card.name}}
            </UiCardTitle>
          <UiCardDescription class="mt-2 block">
            {{convertCurrency(card.price)}}
          </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="text-xs">Компания: {{card.companyName}}</UiCardContent>
          <UiCardFooter>{{dayjs(card.$createdAt).format('DD MMMM YYYY')}}</UiCardFooter>
        </UiCard>
      </div>
    </div>
  </div>
</template>
