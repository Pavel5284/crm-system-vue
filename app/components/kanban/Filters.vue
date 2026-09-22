<script setup lang="ts">
import type { IColumn } from './kanban.types'

const props = defineProps<{
  columns?: IColumn[] | null
}>()

const { t } = useI18n()
const filtersStore = useDealFiltersStore()

// Варианты фильтра по ответственному — из загруженных сделок.
const responsibleOptions = computed(() => {
  const names = (props.columns ?? [])
    .flatMap((col) => col.items)
    .map((d) => d.responsibleName)
    .filter((n): n is string => !!n)
  return [...new Set(names)].sort((a, b) => a.localeCompare(b))
})

// Компания — выпадающее меню: все уникальные значения deal.company + customerName.
const companyOptions = computed(() => {
  const names = (props.columns ?? [])
    .flatMap((col) => col.items)
    .flatMap((d) => [d.company, d.companyName])
    .filter((n): n is string => !!n && n.trim() !== '')
  return [...new Set(names)].sort((a, b) => a.localeCompare(b))
})
</script>

<template>
  <!-- Фильтры доски (локальные, без новых запросов) -->
  <div class="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
    <UiInput
      v-model="filtersStore.query"
      :placeholder="t('kanban.filters.search')"
      :title="t('kanban.filters.search')"
      type="text"
    />
    <UiSelect
      v-model="filtersStore.company"
      :options="companyOptions"
      :title="t('kanban.filters.company')"
      :all-label="t('kanban.filters.allCompanies')"
    />
    <UiSelect
      v-model="filtersStore.responsible"
      :options="responsibleOptions"
      :title="t('kanban.filters.responsible')"
      :all-label="t('kanban.filters.allResponsibles')"
    />
    <UiInput
      v-model="filtersStore.deadlineFrom"
      :title="t('kanban.filters.deadlineFrom')"
      :placeholder="t('kanban.filters.deadlineFrom')"
      type="date"
    />
    <UiInput
      v-model="filtersStore.deadlineTo"
      :title="t('kanban.filters.deadlineTo')"
      :placeholder="t('kanban.filters.deadlineTo')"
      type="date"
    />
    <UiInput
      v-model="filtersStore.createdFrom"
      :title="t('kanban.filters.createdFrom')"
      :placeholder="t('kanban.filters.createdFrom')"
      type="date"
    />
    <UiInput
      v-model="filtersStore.createdTo"
      :title="t('kanban.filters.createdTo')"
      :placeholder="t('kanban.filters.createdTo')"
      type="date"
    />
    <UiInput
      v-model="filtersStore.amountMin"
      :placeholder="t('kanban.filters.amountMin')"
      type="number"
      min="0"
    />
    <UiInput
      v-model="filtersStore.amountMax"
      :placeholder="t('kanban.filters.amountMax')"
      type="number"
      min="0"
    />
    <UiButton
      variant="outline"
      type="button"
      @click="filtersStore.clear()"
    >
      {{ t('kanban.filters.reset') }}
    </UiButton>
  </div>
</template>
