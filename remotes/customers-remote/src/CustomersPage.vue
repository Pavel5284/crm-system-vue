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
import CustomerForm from '@crm/customer-form/CustomerForm.vue'
import CustomerTable from '@crm/customer-form/CustomerTable.vue'
import { CUSTOMER_FORM_LIMITS, type CustomerFormLabels, type CustomerTableLabels } from '@crm/customer-form/types'
import { cn } from './lib/cn'

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
    phoneInvalid: 'Неверный телефон',
    contactPh: 'Контактное лицо',
    sourcePh: 'Источник привлечения',
    save: 'Сохранить',
    saving: 'Сохранение...',
    nameRequired: 'Введите имя',
    nameTooLong: `Название слишком длинное (макс. ${CUSTOMER_FORM_LIMITS.textMaxLength})`,
    nameInvalid: 'Недопустимые символы в имени',
    emailTooLong: `Слишком длинный email (макс. ${CUSTOMER_FORM_LIMITS.emailMaxLength})`,
    emailInvalid: 'Некорректный email',
    textTooLong: `Слишком длинный текст (макс. ${CUSTOMER_FORM_LIMITS.textMaxLength})`,
    textInvalid: 'Недопустимые символы',
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
    phoneInvalid: 'Invalid phone',
    contactPh: 'Contact person',
    sourcePh: 'Source',
    save: 'Save',
    saving: 'Saving...',
    nameRequired: 'Name is required',
    nameTooLong: `Name is too long (max ${CUSTOMER_FORM_LIMITS.textMaxLength})`,
    nameInvalid: 'Invalid characters in name',
    emailTooLong: `Email is too long (max ${CUSTOMER_FORM_LIMITS.emailMaxLength})`,
    emailInvalid: 'Invalid email',
    textTooLong: `Text is too long (max ${CUSTOMER_FORM_LIMITS.textMaxLength})`,
    textInvalid: 'Invalid characters',
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

// Классы кнопок — 1-в-1 host `ui/button` (классы полей формы
// переехали в @crm/customer-form вместе с разметкой).
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

// --- Слайдовер: тело формы — общее (@crm/customer-form), здесь только
// оболочка Dialog, список и HTTP. Строки формы — из STRINGS ниже.
const selected = ref<CustomerDto | null>(null)
const isOpen = ref(false)
const avatarUrlRef = ref('')
const isSaving = ref(false)
const isAvatarSaving = ref(false)
const saveError = ref('')

const formLabels = computed<CustomerFormLabels>(() => ({
  nameLabel: t('namePh'),
  namePlaceholder: t('namePh'),
  emailLabel: 'Email',
  emailPlaceholder: 'Email',
  phoneLabel: t('phonePh'),
  phonePlaceholder: t('phonePh'),
  phoneHint: t('phoneHint'),
  contactLabel: t('contactPh'),
  contactPlaceholder: t('contactPh'),
  sourceLabel: t('sourcePh'),
  sourcePlaceholder: t('sourcePh'),
  avatarHint: t('avatarHint'),
  save: t('save'),
  saving: t('saving'),
  nameRequired: t('nameRequired'),
  nameTooLong: t('nameTooLong'),
  nameInvalid: t('nameInvalid'),
  emailTooLong: t('emailTooLong'),
  emailInvalid: t('emailInvalid'),
  phoneInvalid: t('phoneInvalid'),
  textTooLong: t('textTooLong'),
  textInvalid: t('textInvalid'),
}))

const avatarLabels = computed(() => ({
  upload: t('avatarUpload'),
  remove: t('avatarRemove'),
  fileTooLarge: t('avatarFileTooLarge'),
  onlyImage: t('avatarOnlyImage'),
  readError: t('avatarReadError'),
}))

const tableLabels = computed<CustomerTableLabels>(() => ({
  listTitle: t('listTitle'),
  loading: t('loading'),
  empty: t('empty'),
  avatarCol: t('avatar'),
  nameCol: t('name'),
  emailCol: 'Email',
  phoneCol: t('phone'),
  contactCol: t('contact'),
  sourceCol: t('source'),
  dealsCol: t('deals'),
}))

function open(customer: CustomerDto): void {
  selected.value = customer
  avatarUrlRef.value = customer.avatarUrl || ''
  saveError.value = ''
  isOpen.value = true
}

function close(): void {
  selected.value = null
  isOpen.value = false
}

// Сюда попадаем только при валидной форме (проверка — внутри пакета).
async function onSave(payload: UpdateCustomerPayload): Promise<void> {
  if (!selected.value) return
  saveError.value = ''
  isSaving.value = true
  try {
    const updated = await request<CustomerDto>(`/customers/${selected.value.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    await fetchCustomers()
    // слайдовер НЕ закрываем (как в host): обновляем выбранного ответом
    selected.value = updated
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isSaving.value = false
  }
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
    <div v-if="loadError" class="grid gap-3 justify-start">
      <p>{{ t('loadError') }}: {{ loadError }}</p>
      <button type="button" :class="cn(BTN_BASE, BTN_DEFAULT)" @click="fetchCustomers">{{ t('retry') }}</button>
    </div>

    <CustomerTable
      v-else
      :customers="customers"
      :labels="tableLabels"
      :loading="isLoading"
      @select="open"
    >
      <template #avatar-fallback>
        <User :size="22" class="text-slate-500" />
      </template>
    </CustomerTable>

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
          <CustomerForm
            :customer="selected"
            :labels="formLabels"
            :avatar-labels="avatarLabels"
            :avatar-url="avatarUrlRef"
            :avatar-saving="isAvatarSaving"
            :saving="isSaving"
            :server-error="saveError"
            @save="onSave"
            @upload-avatar="onAvatarDataUrl"
            @remove-avatar="onAvatarRemove"
          >
            <template #avatar-icon="{ saving }">
              <Loader2 v-if="saving" :size="16" class="animate-spin" />
              <Camera v-else :size="16" />
            </template>
          </CustomerForm>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
