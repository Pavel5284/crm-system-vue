<script setup lang="ts">
import type { CustomerTableCustomer, CustomerTableLabels } from './types'

// Общая таблица клиентов (host + remotes): заголовок, состояния
// загрузки/пустоты и разметка 1-в-1 host `ui/table` (те же data-slot
// классы — тот же вид; свой Tailwind-бандл пакет не везёт, классы
// обязаны быть в CSS хоста).
// Набор колонок — объединение обоих вариантов (включая контактное
// лицо: в host-таблице его не было, хотя данные уже загружены).
// Выбор строки — событием `select` (открытие слайдовера — снаружи).
// Фолбэк аватара различается (Nuxt-Icon vs lucide) — слот
// `avatar-fallback` без пропсов.

defineProps<{
  customers: CustomerTableCustomer[]
  labels: CustomerTableLabels
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [customer: CustomerTableCustomer]
}>()
</script>

<template>
  <div>
    <h1 class="font-bold text-2xl mb-10">{{ labels.listTitle }}</h1>

    <div v-if="loading">{{ labels.loading }}</div>

    <div v-else-if="!customers.length" class="text-muted-foreground">{{ labels.empty }}</div>

    <div v-else data-slot="table-container" class="relative w-full overflow-auto">
      <table data-slot="table" class="w-full caption-bottom text-sm">
        <thead data-slot="table-header" class="[&_tr]:border-b">
          <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[80px]">{{ labels.avatarCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[200px]">{{ labels.nameCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[200px]">{{ labels.emailCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ labels.phoneCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ labels.contactCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ labels.sourceCol }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ labels.dealsCol }}</th>
          </tr>
        </thead>
        <tbody data-slot="table-body" class="[&_tr:last-child]:border-0">
          <tr
            v-for="customer in customers"
            :key="customer.id"
            data-slot="table-row"
            class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer"
            @click="emit('select', customer)"
          >
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap">
              <img
                v-if="customer.avatarUrl"
                :src="customer.avatarUrl"
                :alt="customer.name"
                width="50"
                height="50"
                class="w-[50px] h-[50px] rounded-full object-cover shrink-0"
              />
              <div
                v-else
                class="w-[50px] h-[50px] rounded-full bg-[#1a2332] border border-[#161c26] flex items-center justify-center shrink-0"
              >
                <slot name="avatar-fallback" />
              </div>
            </td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.name }}</td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.email }}</td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.phone ?? '—' }}</td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.contactPerson ?? '—' }}</td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.fromSource }}</td>
            <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap font-medium">{{ customer.dealsCount ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
