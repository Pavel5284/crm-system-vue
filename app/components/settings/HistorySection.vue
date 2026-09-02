<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api.ts'
import { getVisitsApi, type Visit } from '~/utils/auth.api.ts'

const visits = ref<Visit[]>([])
const visitsLoading = ref(false)
const visitsPerPage = ref<10 | 25 | 50>(10)
const visitsPage = ref(1)
const visitsTotal = ref(0)

const visitsTotalPages = computed(() => Math.max(1, Math.ceil(visitsTotal.value / visitsPerPage.value)))
const visitsRangeText = computed(() => {
  if (!visitsTotal.value) return ''
  const start = (visitsPage.value - 1) * visitsPerPage.value + 1
  const end = Math.min(visitsPage.value * visitsPerPage.value, visitsTotal.value)
  return `${start}–${end} из ${visitsTotal.value}`
})

const loadVisits = async () => {
  visitsLoading.value = true
  try {
    const res = await getVisitsApi({ page: visitsPage.value, limit: visitsPerPage.value })
    visits.value = res.data
    visitsTotal.value = res.total
    if (res.page) visitsPage.value = res.page
  } catch {
    visits.value = []
    visitsTotal.value = 0
  } finally {
    visitsLoading.value = false
  }
}

watch(visitsPerPage, async () => { visitsPage.value = 1; await loadVisits() })
watch(visitsPage, async () => { await loadVisits() })

onMounted(loadVisits)

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

defineExpose({ loadVisits })
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold">История посещений</h2>
        <p class="text-xs text-muted-foreground">Когда, устройство, браузер, IP — {{ visitsRangeText }}</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model.number="visitsPerPage" class="h-8 rounded-md border border-input bg-background px-2 text-xs">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <UiButton variant="outline" size="sm" @click="loadVisits" :disabled="visitsLoading">Обновить</UiButton>
      </div>
    </div>

    <div v-if="!visitsTotal && !visitsLoading" class="p-6 text-sm text-muted-foreground text-center">Пока нет записей (войдите заново чтобы создать визит)</div>
    <div v-else>
      <div v-if="visitsLoading" class="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="12" class="animate-spin"/> Загрузка…</div>
      <div class="overflow-auto min-h-[120px]">
        <table class="w-full text-sm">
          <thead class="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th class="text-left px-4 py-2 font-medium">Дата</th>
              <th class="text-left px-4 py-2 font-medium">Устройство</th>
              <th class="text-left px-4 py-2 font-medium">Браузер</th>
              <th class="text-left px-4 py-2 font-medium">ОС</th>
              <th class="text-left px-4 py-2 font-medium">IP</th>
            </tr>
          </thead>
          <tbody :class="visitsLoading && 'opacity-50 pointer-events-none'">
            <tr v-for="v in visits" :key="v.id" class="border-b border-border/60 hover:bg-accent/40">
              <td class="px-4 py-2 whitespace-nowrap">{{ formatDate(v.createdAt) }}</td>
              <td class="px-4 py-2">{{ v.device || '—' }}</td>
              <td class="px-4 py-2">{{ v.browser || '—' }}</td>
              <td class="px-4 py-2">{{ v.os || '—' }}</td>
              <td class="px-4 py-2 font-mono text-xs">{{ v.ip }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="visitsTotalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-border">
        <span class="text-xs text-muted-foreground">Стр. {{ visitsPage }} из {{ visitsTotalPages }} ({{ visitsTotal }} всего)</span>
        <div class="flex gap-1">
          <UiButton type="button" variant="outline" size="sm" :disabled="visitsPage <= 1 || visitsLoading" @click.stop="visitsPage--">Назад</UiButton>
          <UiButton type="button" variant="outline" size="sm" :disabled="visitsPage >= visitsTotalPages || visitsLoading" @click.stop="visitsPage++">Вперёд</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
