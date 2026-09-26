<script setup lang="ts">
import { Camera, Loader2, User, X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { computed, onMounted, ref } from 'vue'
import type { CustomerDto, CustomersPageProps, MfeLocale, UpdateCustomerPayload } from '@crm/mfe-contracts'
import { cn } from './lib/cn'
import PhoneInput from '@crm/ui-kit/PhoneInput.vue'

// ВАЖНО: тему/styles.css здесь НЕ импортируем. Remote рендерится внутри
// страницы хоста и пользуется его собранным CSS 1-в-1 (те же классы —
// тот же вид, как у USlideover на home page). Свой Tailwind-бандл давал бы
// дубликаты утилит (.text-muted, .text-sm) и мог перебивать стили хоста.
// Для standalone-playground стили подключает main.ts.

// Контракт пропсов — из @crm/mfe-contracts (правило №4).
const props = withDefaults(defineProps<CustomersPageProps>(), { locale: 'ru' })

// Строки — зеркало host `i18n/locales/{ru,en}.json` (customers.* + avatar.*).
const STRINGS: Record<MfeLocale, Record<string, string>> = {
  ru: {
    listTitle: 'Список клиентов',
    loading: 'Загрузка...',
    loadError: 'Не удалось загрузить клиентов',
    retry: 'Повторить',
    avatar: 'Изображение',
    name: 'Наименование',
    phone: 'Телефон',
    contact: 'Контактное лицо',
    source: 'Источник привлечения',
    deals: 'Сделок',
    about: 'О клиенте',
    aboutDescription: 'Информация о клиенте',
    namePh: 'Имя',
    phonePh: 'Телефон',
    phoneHint: 'Формат: 7-20 цифр',
    contactPh: 'Контактное лицо',
    sourcePh: 'Источник привлечения',
    save: 'Сохранить',
    saving: 'Сохранение...',
    avatarHint: 'PNG, JPG, WEBP, GIF до 2MB',
    avatarUpload: 'Загрузить аватар',
    avatarRemove: 'Удалить аватар',
    avatarFileTooLarge: 'Файл до 2MB',
    avatarOnlyImage: 'Только изображение',
    avatarReadError: 'Не удалось прочитать файл',
    closeDialog: 'Закрыть',
    empty: 'Клиентов пока нет',
  },
  en: {
    listTitle: 'Customer list',
    loading: 'Loading...',
    loadError: 'Failed to load customers',
    retry: 'Retry',
    avatar: 'Avatar',
    name: 'Name',
    phone: 'Phone',
    contact: 'Contact person',
    source: 'Source',
    deals: 'Deals',
    about: 'About customer',
    aboutDescription: 'Customer information',
    namePh: 'Name',
    phonePh: 'Phone',
    phoneHint: 'Format: 7-20 digits',
    contactPh: 'Contact person',
    sourcePh: 'Source',
    save: 'Save',
    saving: 'Saving...',
    avatarHint: 'PNG, JPG, WEBP, GIF up to 2MB',
    avatarUpload: 'Upload avatar',
    avatarRemove: 'Remove avatar',
    avatarFileTooLarge: 'File up to 2MB',
    avatarOnlyImage: 'Only image',
    avatarReadError: 'Failed to read file',
    closeDialog: 'Close',
    empty: 'No customers yet',
  },
}

// Классы — 1-в-1 из host (`ui/table/*`, `ui/input/Input.vue`,
// `ui/button/index.ts`, `ui/AvatarUploader.vue`), чтобы remote
// выглядел как слайдовер home page (там тот же USlideover).
const INPUT_CLASS = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
const BTN_BASE = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 has-[>svg]:px-3'
const BTN_DEFAULT = 'bg-primary text-primary-foreground hover:opacity-75'

const t = (key: string): string => STRINGS[props.locale]?.[key] ?? STRINGS.ru[key] ?? key
const apiBase = computed(() => props.apiBaseUrl.replace(/\/$/, ''))

// --- Минимальный fetch-клиент: повторяет семантику host apiFetch ---
// Обертка провода `{ success: true, data: T }`, auth — httpOnly cookie.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase.value}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { message?: unknown }
      if (typeof body.message === 'string' && body.message) message = body.message
    } catch { /* ignore */ }
    throw new Error(message)
  }
  const json = (await res.json()) as { success?: boolean, data?: T } | T
  if (json && typeof json === 'object' && 'success' in json) return (json as { data: T }).data
  return json as T
}

// --- Список ---
const customers = ref<CustomerDto[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function fetchCustomers(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    customers.value = await request<CustomerDto[]>('/customers')
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => { void fetchCustomers() })

// --- Слайдовер (локальное состояние вместо host-стора useCustomerSlideStore) ---
const selected = ref<CustomerDto | null>(null)
const isOpen = ref(false)
const nameRef = ref('')
const emailRef = ref('')
const phoneRef = ref('')
const contactPersonRef = ref('')
const avatarUrlRef = ref('')
const fromSourceRef = ref('')
const isSaving = ref(false)
const isAvatarSaving = ref(false)
const saveError = ref('')
const avatarErrorRef = ref('')

function open(customer: CustomerDto): void {
  selected.value = customer
  nameRef.value = customer.name
  emailRef.value = customer.email
  phoneRef.value = customer.phone ?? ''
  contactPersonRef.value = customer.contactPerson ?? ''
  avatarUrlRef.value = customer.avatarUrl || ''
  fromSourceRef.value = customer.fromSource ?? ''
  saveError.value = ''
  avatarErrorRef.value = ''
  isOpen.value = true
}

function close(): void {
  selected.value = null
  isOpen.value = false
}

const isDirty = computed(() => {
  const c = selected.value
  if (!c) return false
  return (
    nameRef.value !== c.name
    || emailRef.value !== c.email
    || (phoneRef.value || '') !== (c.phone ?? '')
    || (contactPersonRef.value || '') !== (c.contactPerson ?? '')
    || (fromSourceRef.value || '') !== (c.fromSource ?? '')
  )
})

const initials = computed(() => {
  const name = nameRef.value || selected.value?.name || ''
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
})

async function onSave(): Promise<void> {
  if (!selected.value) return
  saveError.value = ''
  isSaving.value = true
  try {
    const payload: UpdateCustomerPayload = {
      name: nameRef.value,
      email: emailRef.value,
      phone: phoneRef.value || null,
      contactPerson: contactPersonRef.value || null,
      fromSource: fromSourceRef.value || null,
    }
    const updated = await request<CustomerDto>(`/customers/${selected.value.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    await fetchCustomers()
    // слайдовер НЕ закрываем (как в host): обновляем выбранного ответом,
    // чтобы сбросить isDirty
    selected.value = updated
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isSaving.value = false
  }
}

function onAvatarFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !selected.value) return
  // Валидация как в host `UiAvatarUploader` (2MB, только изображения).
  if (file.size > 2 * 1024 * 1024) {
    avatarErrorRef.value = t('avatarFileTooLarge')
    return
  }
  if (!file.type.startsWith('image/')) {
    avatarErrorRef.value = t('avatarOnlyImage')
    return
  }
  avatarErrorRef.value = ''
  const reader = new FileReader()
  reader.onload = () => { void onAvatarDataUrl(String(reader.result)) }
  reader.onerror = () => { avatarErrorRef.value = t('avatarReadError') }
  reader.readAsDataURL(file)
}

async function onAvatarDataUrl(dataUrl: string): Promise<void> {
  if (!selected.value) return
  saveError.value = ''
  isAvatarSaving.value = true
  try {
    await request(`/customers/${selected.value.id}/avatar`, { method: 'POST', body: JSON.stringify({ avatarUrl: dataUrl }) })
    avatarUrlRef.value = dataUrl
    await fetchCustomers()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
    avatarUrlRef.value = selected.value.avatarUrl || ''
  } finally {
    isAvatarSaving.value = false
  }
}

async function onAvatarRemove(): Promise<void> {
  if (!selected.value) return
  saveError.value = ''
  isAvatarSaving.value = true
  try {
    await request(`/customers/${selected.value.id}/avatar`, { method: 'DELETE' })
    avatarUrlRef.value = ''
    await fetchCustomers()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isAvatarSaving.value = false
  }
}
</script>

<template>
  <div class="px-1 py-2">
    <h1 class="font-bold text-2x1 mb-10">{{ t('listTitle') }}</h1>

    <div v-if="isLoading">{{ t('loading') }}</div>

    <div v-else-if="loadError" class="grid gap-3 justify-start">
      <p>{{ t('loadError') }}: {{ loadError }}</p>
      <button type="button" :class="cn(BTN_BASE, BTN_DEFAULT)" @click="fetchCustomers">{{ t('retry') }}</button>
    </div>

    <div v-else-if="!customers.length" class="text-muted-foreground">{{ t('empty') }}</div>

    <div v-else data-slot="table-container" class="relative w-full overflow-auto">
      <table data-slot="table" class="w-full caption-bottom text-sm">
        <thead data-slot="table-header" class="[&_tr]:border-b">
          <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[80px]">{{ t('avatar') }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[200px]">{{ t('name') }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[200px]">Email</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ t('phone') }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ t('contact') }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ t('source') }}</th>
            <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">{{ t('deals') }}</th>
          </tr>
        </thead>
        <tbody data-slot="table-body" class="[&_tr:last-child]:border-0">
          <tr
            v-for="customer in customers"
            :key="customer.id"
            data-slot="table-row"
            class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors cursor-pointer"
            @click="open(customer)"
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
                <User :size="22" class="text-slate-500" />
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

    <!-- Разметка и классы — 1-в-1 host `USlideover` (side=right):
         тема slideover из .nuxt/ui/slideover.ts, резолвится из CSS хоста. -->
    <DialogRoot :open="isOpen" @update:open="(v: boolean) => { if (!v) close() }">
      <DialogPortal>
        <DialogOverlay data-slot="overlay" class="fixed inset-0 bg-elevated/75 data-[state=open]:animate-[fade-in_200ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_200ms_var(--ease-out)]" />
        <DialogContent
          data-side="right"
          data-slot="content"
          class="fixed bg-default divide-y divide-default sm:ring ring-default sm:shadow-lg flex flex-col focus:outline-none max-w-md w-full inset-y-0 right-0 data-[state=open]:animate-[slide-in-from-right_200ms_var(--ease-out)] data-[state=closed]:animate-[slide-out-to-right_200ms_var(--ease-out)]"
          @escape-key-down="close"
          @pointer-down-outside="close"
        >
          <div data-slot="header" class="flex items-center gap-1.5 p-4 sm:px-6 min-h-(--ui-header-height)">
            <div data-slot="wrapper">
              <DialogTitle data-slot="title" class="text-highlighted font-semibold">{{ t('about') }}</DialogTitle>
              <DialogDescription data-slot="description" class="mt-1 text-muted text-sm">{{ t('aboutDescription') }}</DialogDescription>
            </div>
            <DialogClose
              data-slot="close"
              :aria-label="t('closeDialog')"
              :class="cn('rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors text-default hover:bg-elevated active:bg-elevated outline-inverted/25 focus-visible:outline-3 hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent p-1.5 absolute top-4 end-4')"
            >
              <X :size="20" class="shrink-0" />
            </DialogClose>
          </div>

          <div data-slot="body" class="flex-1 overflow-y-auto p-4 sm:p-6">
          <div class="mb-5 flex flex-col items-center gap-3">
            <div class="flex flex-col items-center gap-3 shrink-0">
              <div class="relative">
                <img
                  v-if="avatarUrlRef"
                  :src="avatarUrlRef"
                  alt="avatar"
                  class="rounded-full object-cover border-2 border-border"
                  :style="{ width: '96px', height: '96px' }"
                />
                <div
                  v-else
                  class="rounded-full bg-primary text-primary-foreground grid place-items-center font-bold border-2 border-border"
                  :style="{ width: '96px', height: '96px', fontSize: '27px' }"
                >
                  {{ initials }}
                </div>
                <label
                  :class="cn('absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow hover:opacity-90 transition-opacity', isAvatarSaving && 'opacity-50 pointer-events-none')"
                  :title="t('avatarUpload')"
                >
                  <Loader2 v-if="isAvatarSaving" :size="16" class="animate-spin" />
                  <Camera v-else :size="16" />
                  <input type="file" accept="image/*" class="hidden" :disabled="isAvatarSaving" @change="onAvatarFile" />
                </label>
              </div>
              <button
                v-if="avatarUrlRef"
                type="button"
                class="text-xs text-red-500 hover:underline disabled:opacity-50"
                :disabled="isAvatarSaving"
                @click="onAvatarRemove"
              >
                {{ t('avatarRemove') }}
              </button>
              <p v-if="avatarErrorRef" class="text-red-500 text-xs">{{ avatarErrorRef }}</p>
            </div>
            <p class="text-xs text-muted-foreground">{{ t('avatarHint') }}</p>
          </div>

          <div class="space-y-3">
            <input v-model="nameRef" type="text" :class="INPUT_CLASS" :placeholder="t('namePh')" />
            <input v-model="emailRef" type="email" :class="INPUT_CLASS" placeholder="Email" />
            <PhoneInput v-model="phoneRef" :placeholder="t('phonePh')" :hint="t('phoneHint')" />
            <input v-model="contactPersonRef" type="text" :class="INPUT_CLASS" :placeholder="t('contactPh')" />
            <input v-model="fromSourceRef" type="text" :class="INPUT_CLASS" :placeholder="t('sourcePh')" />
          </div>

          <p v-if="saveError" class="text-red-500 text-sm mt-3">{{ saveError }}</p>

          <div class="flex items-center gap-3 mt-5">
            <button type="button" :class="cn(BTN_BASE, BTN_DEFAULT)" :disabled="isSaving || !isDirty" @click="onSave">
              {{ isSaving ? t('saving') : t('save') }}
            </button>
          </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
