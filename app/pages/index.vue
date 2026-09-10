<script setup lang="ts">
import {useKanbanQuery} from '@/components/kanban/useKanbanQuery'
import type {ICard, IColumn} from '~/components/kanban/kanban.types'
import type {EnumStatus} from "~/types/deals.types"
import {updateDealStatusApi} from "~/utils/crm.api"
import {generateColumnStyle} from "@/components/kanban/generate-gradient"
import { formatDate } from '~/utils/formatDate'
import { VueDraggable } from 'vue-draggable-plus'

const { t, locale } = useI18n()

useSeoMeta({
  title: t('kanban.seoTitle')
})

const {data, isLoading, refetch} = useKanbanQuery()
const store = useDealSlideStore()

type TypeMutationVariables = {
  docId: string
  status?: EnumStatus
}
const {mutate} = useMutation({
  mutationKey: ['move card'],
  mutationFn: ({docId, status}: TypeMutationVariables) =>
      updateDealStatusApi(docId, status as EnumStatus),
  onSuccess: () => {
    refetch()
  },
  onError: () => {
    refetch()
  }
})

// мобилка: вкладки - показываем только 1 колонку, перемещение через меню
const activeTab = ref<EnumStatus | string | null>(null)

// локальная копия доски для drag (query data readonly, v-model мутировать нельзя)
const board = ref<IColumn[]>([])
watch(() => data.value, (cols) => {
  if (cols) {
    board.value = JSON.parse(JSON.stringify(cols))
  }
}, { immediate: true, deep: false })

watch(() => data.value, (cols) => {
  if (cols?.length && !activeTab.value) {
    activeTab.value = cols[0].id as EnumStatus
  }
}, { immediate: true })

const activeColumn = computed<IColumn | undefined>(() => {
  if (!board.value.length) return undefined
  return board.value.find(c => c.id === activeTab.value) ?? board.value[0]
})
const activeColumnIndex = computed(() => {
  if (!board.value.length || !activeTab.value) return 0
  return board.value.findIndex(c => c.id === activeTab.value)
})

function onMoveCard(cardId: string, newStatus: string) {
  if (!newStatus || newStatus === activeTab.value) return
  mutate({ docId: cardId, status: newStatus as EnumStatus })
}

// прокрутка табов мышкой: drag + колесо
const tabsRef = ref<HTMLDivElement | null>(null)
let tabsDragging = false
let tabsStartX = 0
let tabsScrollLeft = 0
let tabsMoved = false

function onTabsWheel(e: WheelEvent) {
  const el = tabsRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  // вертикальное колесо -> горизонтальный скролл
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault()
    el.scrollLeft += e.deltaY
  }
}
function onTabsPointerDown(e: PointerEvent) {
  const el = tabsRef.value
  if (!el) return
  // клик по кнопке не должен сразу скроллить — только drag
  if ((e.target as HTMLElement).closest('button')) {
    // разрешаем клик, но запоминаем старт для возможного drag
  }
  tabsDragging = true
  tabsMoved = false
  tabsStartX = e.clientX
  tabsScrollLeft = el.scrollLeft
  el.style.cursor = 'grabbing'
}
function onTabsPointerMove(e: PointerEvent) {
  if (!tabsDragging) return
  const el = tabsRef.value
  if (!el) return
  const dx = e.clientX - tabsStartX
  if (Math.abs(dx) > 5) {
    tabsMoved = true
    // предотвращаем выделение текста при drag
    e.preventDefault()
  }
  el.scrollLeft = tabsScrollLeft - dx
}
function onTabsPointerUp() {
  tabsDragging = false
  const el = tabsRef.value
  if (el) {
    el.style.cursor = 'grab'
  }
  // tabsMoved сбросится в onTabClick при клике, либо через таймаут если drag без клика
  if (tabsMoved) {
    setTimeout(() => { tabsMoved = false }, 50)
  }
}
function onTabClick(colId: string) {
  if (tabsMoved) {
    tabsMoved = false
    return
  }
  activeTab.value = colId as EnumStatus
}


function onDragAdd(evt: { data?: unknown; newIndex?: number }, targetColumn: IColumn) {
  let card: ICard | null = (evt?.data as ICard) ?? null
  if (!card && typeof evt?.newIndex === 'number') {
    card = targetColumn.items[evt.newIndex] as ICard | null
  }
  if (!card) return
  mutate({ docId: card.id, status: targetColumn.id as EnumStatus })
}

</script>

<template>
  <div class="mb-5">
    <h1 class="text-2xl font-bold">{{ t('kanban.title') }}</h1>
  </div>
  <div v-if="isLoading">{{ t('kanban.loading') }}</div>
  <div v-else>
    <!-- Мобилка: вкладки + 1 колонка + меню перемещения (без drag и без скролла) -->
    <div class="xl:hidden">
      <div
        ref="tabsRef"
        @wheel="onTabsWheel"
        @pointerdown="onTabsPointerDown"
        @pointermove="onTabsPointerMove"
        @pointerup="onTabsPointerUp"
        @pointerleave="onTabsPointerUp"
        class="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 cursor-grab active:cursor-grabbing select-none touch-pan-x overscroll-x-contain"
      >
        <button
          v-for="(col, idx) in board"
          :key="col.id"
          @click="onTabClick(col.id as string)"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border transition-colors"
          :class="activeTab === col.id ? 'text-white border-transparent shadow' : 'bg-card border-border hover:bg-accent'"
          :style="activeTab === col.id ? generateColumnStyle(idx, board.length) : {}"
        >
          {{ t(col.name) }}
          <span class="ml-1.5 text-xs opacity-80">({{ col.items.length }})</span>
        </button>
      </div>

      <div v-if="activeColumn" class="mt-4">
        <div
          class="rounded bg-slate-700 py-2 px-3 mb-3 text-center min-h-[48px] flex items-center justify-center text-sm leading-tight font-medium break-words"
          :style="generateColumnStyle(activeColumnIndex, board.length)"
        >
          {{ t(activeColumn.name) }}
        </div>
        <KanbanCreateDeal :refetch="refetch" :status="activeColumn.id as string" />
        <div v-if="activeColumn.items.length" class="space-y-3 mt-3">
          <UiCard
            v-for="card in activeColumn.items"
            :key="card.id"
            class="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            role="button"
            @click="store.set(card)"
          >
            <UiCardHeader>
              <UiCardTitle>{{ card.name }}</UiCardTitle>
              <UiCardDescription class="mt-2 block">{{ convertCurrency(card.price, locale) }}</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="text-xs">{{ t('kanban.company') }}: {{ card.companyName }}</UiCardContent>
            <UiCardFooter>{{ formatDate(card.createdAt, 'long', locale) }}</UiCardFooter>
            <div class="px-4 pb-3 pt-1 border-t border-border/50 mt-1" @click.stop>
              <label class="text-[11px] uppercase tracking-wide text-muted-foreground">{{ t('kanban.moveTo') }}</label>
              <select
                :value="activeColumn!.id"
                @click.stop
                @change="onMoveCard(card.id, ($event.target as HTMLSelectElement).value)"
                class="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option v-for="c in board" :key="c.id" :value="c.id" class="bg-background text-foreground">
                  {{ t(c.name) }}{{ c.id === activeColumn!.id ? ' ✓' : '' }}
                </option>
              </select>
            </div>
          </UiCard>
        </div>
        <p v-else class="text-center text-sm text-muted-foreground py-10">{{ t('common.noData') }}</p>
      </div>
    </div>

    <!-- Десктоп: 5 колонок grid + drag&drop через vuedraggable (популярная для Nuxt4), заголовки одинаковой высоты -->
    <div class="hidden xl:grid xl:grid-cols-5 gap-6">
      <div
        v-for="(column, index) in board"
            :key="column.id"
            class="flex flex-col min-w-0"
      >
        <div
          class="rounded bg-slate-700 py-2 px-3 mb-3 text-center min-h-[60px] flex items-center justify-center text-sm leading-tight font-medium break-words hyphens-auto"
             :style="generateColumnStyle(index, board.length)"
        >
          {{ t(column.name) }}
        </div>
        <KanbanCreateDeal :refetch="refetch" :status="column.id"/>
        <VueDraggable
          v-model="column.items"
          group="kanban"
          :animation="300"
          class="flex-1 min-h-[100px] flex flex-col gap-3"
          @add="(evt: any) => onDragAdd(evt, column)"
        >
          <div
            v-for="card in column.items"
            :key="card.id"
          >
            <UiCard
              class="cursor-move hover:shadow-md transition-shadow"
              role="button"
              @click="store.set(card)"
            >
              <UiCardHeader>
                <UiCardTitle>{{ card.name }}</UiCardTitle>
                <UiCardDescription class="mt-2 block">{{ convertCurrency(card.price, locale) }}</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="text-xs">{{ t('kanban.company') }}: {{ card.companyName }}</UiCardContent>
              <UiCardFooter>{{ formatDate(card.createdAt, 'long', locale) }}</UiCardFooter>
            </UiCard>
          </div>
        </VueDraggable>
      </div>
    </div>
    <KanbanSlideover/>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.drag-ghost {
  opacity: 0.4;
}
.drag-chosen {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
.drag-drag {
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  transform: rotate(1deg);
}
</style>

