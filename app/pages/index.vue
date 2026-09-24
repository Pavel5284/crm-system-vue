<script setup lang="ts">
import {useKanbanQuery} from '@/components/kanban/useKanbanQuery'
import {isTransitionAllowed, useAllowedTransitionsQuery} from '@/components/kanban/useAllowedTransitionsQuery'
import type {ICard, IColumn} from '~/components/kanban/kanban.types'
import type { DealStatus } from "~/types/backend.contracts"
import {canCreateDeal} from "~/utils/deal-permissions"
import {updateDealStatusApi} from "~/utils/crm.api"
import {getApiErrorMessage} from "~/utils/api"
import {parseMissingDealFields} from "~/utils/deal-move-error"
import {generateColumnStyle} from "@/components/kanban/generate-gradient"
import { formatDate } from '~/utils/formatDate'
import { VueDraggable } from 'vue-draggable-plus'

const { t, locale } = useI18n()

useSeoMeta({
  title: t('kanban.seoTitle')
})

const {data, isLoading, refetch} = useKanbanQuery()
const store = useDealSlideStore()
const authStore = useAuthStore()
const {data: allowedTransitions} = useAllowedTransitionsQuery()

// Единая точка входа (Этап 2): новые сделки создаются только в «Входящих».
const ENTRY_STAGE_ID = 'todo'

// RBAC (Этап 4): создание скрываем по роли; проверка — на бэкенде.
const canCreate = computed(() => canCreateDeal(authStore.user.role))

// Цели, разрешённые ТЕКУЩЕМУ пользователю по роли (без проверки полей —
// её бэкенд всё равно выполнит при попытке перехода).
const allowedTargets = (fromStage: string): string[] => {
  const list = allowedTransitions.value ?? []
  return [...new Set(list.filter((t) => t.fromStage === fromStage).map((t) => t.toStage))]
}

// Колонки для меню перемещения: текущая + разрешённые по роли.
// Остальные скрываем (UX); проверка обязана быть на бэкенде.
const movableColumns = (columnId: string): IColumn[] =>
    board.value.filter((c) => c.id === columnId || isTransitionAllowed(allowedTransitions.value, columnId, c.id))

// Этап 7: сумма сделок в колонке.
function columnSum(column: IColumn): number {
  return column.items.reduce((sum, card) => sum + (Number(card.price) || 0), 0)
}

// Этап 7: просрочка — дедлайн прошёл, а сделка не на финальном этапе.
function isOverdue(card: ICard): boolean {
  if (!card.deadline || card.status === 'done') return false
  return new Date(card.deadline).getTime() < Date.now()
}

// Перенос без комментария: drag и меню сразу сохраняют новый этап
// через PATCH /deals/:id/stage. Проверки переходов и полей — на бэкенде:
// при ошибке apiFetch покажет тост, а refetch откатит локальное перемещение.
function findCard(cardId: string): ICard | null {
  for (const col of board.value) {
    const found = col.items.find((c) => c.id === cardId)
    if (found) return found
  }
  return null
}

async function moveDeal(card: ICard, target: string) {
  if (!target || card.status === target) return
  try {
    await updateDealStatusApi(card.id, target as DealStatus)
    store.clearPending()
    if (store.card && store.card.id === card.id) store.card.status = target
  } catch (e) {
    // Тост с текстом ошибки показывает apiFetch. Откатываем локальный drag
    // синхронно (на refetch полагаться нельзя) и открываем карточку
    // с подсветкой полей, которые бэкенд требует заполнить/исправить.
    // Цель запоминается — перенос повторится сам, когда поля заполнят.
    rebuildBoard(data.value)
    store.failMove(card, parseMissingDealFields(getApiErrorMessage(e)), target)
  } finally {
    refetch()
  }
}

// Автоповтор отложенного переноса: все подсвеченные поля заполнены.
watch(
  [() => store.pendingTargetStage, () => store.highlightFields.length],
  ([target, count]) => {
    if (target && count === 0 && store.card) {
      const retryTarget = store.consumePending()
      if (retryTarget) void moveDeal(store.card, retryTarget)
    }
  },
)

// Слайдовер закрыли, поля проигнорированы: незавершённый перенос
// отменяется — карточка возвращается в исходную колонку.
watch(() => store.isOpen, (open) => {
  if (!open && store.pendingTargetStage) {
    store.clearPending()
    rebuildBoard(data.value)
  }
})

function onMoveCard(cardId: string, target: string) {
  const card = findCard(cardId)
  if (!card) return
  void moveDeal(card, target)
}

// мобилка: вкладки - показываем только 1 колонку, перемещение через меню
const activeTab = ref<DealStatus | string | null>(null)

// локальная копия доски для drag (query data readonly, v-model мутировать нельзя)
// Этап 7: здесь же применяются фильтры (без новых запросов).
const board = ref<IColumn[]>([])
const filtersStore = useDealFiltersStore()
// Пересборка board из серверных данных (откатывает локальный drag,
// т.к. vuedraggable мутирует board напрямую, а refetch() — асинхронный
// и не гарантирует новой ссылки данных).
function rebuildBoard(cols: IColumn[] | undefined | null) {
  if (!cols) {
    board.value = []
    return
  }
  const cloned: IColumn[] = JSON.parse(JSON.stringify(cols))
  board.value = cloned.map((col) => ({
    ...col,
    items: col.items.filter((item) => filtersStore.matches(item)),
  }))
  // Мобилка показывает только activeColumn: если фильтр опустошил текущую
  // вкладку, а совпадения есть в других колонках — переключаемся на первую
  // непустую, иначе пользователь видит "Нет данных", хотя айтем есть.
  const current = board.value.find((c) => c.id === activeTab.value)
  if (current && current.items.length === 0) {
    const firstNonEmpty = board.value.find((c) => c.items.length > 0)
    if (firstNonEmpty) activeTab.value = firstNonEmpty.id as DealStatus
  }
}

watch(
  [
    () => data.value,
    () => filtersStore.query,
    () => filtersStore.company,
    () => filtersStore.responsible,
    () => filtersStore.deadlineFrom,
    () => filtersStore.deadlineTo,
    () => filtersStore.createdFrom,
    () => filtersStore.createdTo,
    () => filtersStore.amountMin,
    () => filtersStore.amountMax,
  ],
  ([cols]) => rebuildBoard(cols),
  { immediate: true },
)

watch(() => data.value, (cols) => {
  const first = cols?.[0]
  if (first && !activeTab.value) {
    activeTab.value = first.id as DealStatus
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
  activeTab.value = colId as DealStatus
}


function onDragAdd(evt: { data?: unknown; newIndex?: number }, targetColumn: IColumn) {
  let card: ICard | null = (evt?.data as ICard) ?? null
  if (!card && typeof evt?.newIndex === 'number') {
    card = targetColumn.items[evt.newIndex] as ICard | null
  }
  if (!card) return
  // vuedraggable уже переместил карточку локально — сразу сохраняем;
  // moveDeal при ошибке откатит через refetch.
  void moveDeal(card, targetColumn.id)
}

</script>

<template>
  <div class="mb-5">
    <h1 class="text-2xl font-bold">{{ t('kanban.title') }}</h1>
  </div>
  <!-- Этап 7: фильтры доски (локальные, без новых запросов) -->
  <KanbanFilters :columns="data" />
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
          class="rounded bg-slate-700 py-2 px-3 mb-3 text-center min-h-[48px] flex flex-col items-center justify-center text-sm leading-tight font-medium break-words"
          :style="generateColumnStyle(activeColumnIndex, board.length)"
        >
          <span>{{ t(activeColumn.name) }}</span>
          <span class="text-xs opacity-80 font-normal">
            {{ activeColumn.items.length }} · {{ convertCurrency(columnSum(activeColumn), locale) }}
          </span>
        </div>
        <KanbanCreateDeal v-if="activeColumn.id === ENTRY_STAGE_ID && canCreate" :refetch="refetch" />
        <div v-if="activeColumn.items.length" class="space-y-3 mt-3">
          <UiCard
            v-for="card in activeColumn.items"
            :key="card.id"
            class="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            :class="{ 'border-red-500/60': isOverdue(card) }"
            role="button"
            @click="store.set(card)"
          >
            <UiCardHeader>
              <UiCardTitle>{{ card.name }}</UiCardTitle>
              <UiCardDescription class="mt-2 block">{{ convertCurrency(card.price, locale) }}</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="text-xs">{{ t('kanban.company') }}: {{ card.customerName }}</UiCardContent>
            <UiCardContent class="text-xs">{{ t('kanban.responsible') }}: {{ card.responsibleName ?? '—' }}</UiCardContent>
            <UiCardContent class="text-xs" :class="{ 'text-red-400 font-medium': isOverdue(card) }">
              {{ t('kanban.deadline') }}: {{ card.deadline ? formatDate(card.deadline, 'short', locale) : '—' }}
            </UiCardContent>
            <UiCardFooter>{{ formatDate(card.createdAt, 'long', locale) }}</UiCardFooter>
            <div v-if="allowedTargets(activeColumn.id).length > 0" class="px-4 pb-3 pt-1 border-t border-border/50 mt-1" @click.stop>
              <label class="text-[11px] uppercase tracking-wide text-muted-foreground">{{ t('kanban.moveTo') }}</label>
              <select
                :value="activeColumn!.id"
                @click.stop
                @change="onMoveCard(card.id, ($event.target as HTMLSelectElement).value)"
                class="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option v-for="c in movableColumns(activeColumn.id)" :key="c.id" :value="c.id" class="bg-background text-foreground">
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
          class="rounded bg-slate-700 py-2 px-3 mb-3 text-center min-h-[60px] flex flex-col items-center justify-center text-sm leading-tight font-medium break-words hyphens-auto"
             :style="generateColumnStyle(index, board.length)"
        >
          <span>{{ t(column.name) }}</span>
          <span class="text-xs opacity-80 font-normal">
            {{ column.items.length }} · {{ convertCurrency(columnSum(column), locale) }}
          </span>
        </div>
        <KanbanCreateDeal v-if="column.id === ENTRY_STAGE_ID && canCreate" :refetch="refetch" />
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
              :class="{ 'border-red-500/60': isOverdue(card) }"
              role="button"
              @click="store.set(card)"
            >
              <UiCardHeader>
                <UiCardTitle>{{ card.name }}</UiCardTitle>
                <UiCardDescription class="mt-2 block">{{ convertCurrency(card.price, locale) }}</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="text-xs">{{ t('kanban.company') }}: {{ card.customerName }}</UiCardContent>
              <UiCardContent class="text-xs">{{ t('kanban.responsible') }}: {{ card.responsibleName ?? '—' }}</UiCardContent>
              <UiCardContent class="text-xs" :class="{ 'text-red-400 font-medium': isOverdue(card) }">
                {{ t('kanban.deadline') }}: {{ card.deadline ? formatDate(card.deadline, 'short', locale) : '—' }}
              </UiCardContent>
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

