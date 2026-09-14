<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CustomerDto, CustomersPageProps, MfeLocale, UpdateCustomerPayload } from '@crm/mfe-contracts'

// Контракт пропсов — из @crm/mfe-contracts (правило №4).
const props = withDefaults(defineProps<CustomersPageProps>(), { locale: 'ru' })

const STRINGS: Record<MfeLocale, Record<string, string>> = {
  ru: {
    listTitle: 'Список клиентов',
    loading: 'Загрузка...',
    loadError: 'Не удалось загрузить клиентов',
    retry: 'Повторить',
    avatar: 'Изображение',
    name: 'Наименование',
    source: 'Источник привлечения',
    about: 'О клиенте',
    namePh: 'Имя',
    sourcePh: 'Источник привлечения',
    save: 'Сохранить',
    saving: 'Сохранение...',
    close: 'Закрыть',
    avatarHint: 'Нажмите, чтобы заменить аватар',
    removeAvatar: 'Убрать аватар',
    empty: 'Клиентов пока нет',
  },
  en: {
    listTitle: 'Customers',
    loading: 'Loading...',
    loadError: 'Failed to load customers',
    retry: 'Retry',
    avatar: 'Avatar',
    name: 'Name',
    source: 'Source',
    about: 'About customer',
    namePh: 'Name',
    sourcePh: 'Acquisition source',
    save: 'Save',
    saving: 'Saving...',
    close: 'Close',
    avatarHint: 'Click to replace avatar',
    removeAvatar: 'Remove avatar',
    empty: 'No customers yet',
  },
}

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
const avatarUrlRef = ref('')
const fromSourceRef = ref('')
const isSaving = ref(false)
const isAvatarSaving = ref(false)
const saveError = ref('')

function open(customer: CustomerDto): void {
  selected.value = customer
  nameRef.value = customer.name
  emailRef.value = customer.email
  avatarUrlRef.value = customer.avatarUrl || ''
  fromSourceRef.value = customer.fromSource ?? ''
  saveError.value = ''
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
      fromSource: fromSourceRef.value || null,
    }
    await request<CustomerDto>(`/customers/${selected.value.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    await fetchCustomers()
    close()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    isSaving.value = false
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onAvatarFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !selected.value) return
  saveError.value = ''
  isAvatarSaving.value = true
  try {
    const dataUrl = await readAsDataUrl(file)
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
  <div class="mfe-customers">
    <h1 class="mfe-title">{{ t('listTitle') }}</h1>

    <div v-if="isLoading" class="mfe-muted">{{ t('loading') }}</div>

    <div v-else-if="loadError" class="mfe-error-block">
      <p>{{ t('loadError') }}: {{ loadError }}</p>
      <button type="button" class="mfe-btn" @click="fetchCustomers">{{ t('retry') }}</button>
    </div>

    <div v-else-if="!customers.length" class="mfe-muted">{{ t('empty') }}</div>

    <table v-else class="mfe-table">
      <thead>
        <tr>
          <th>{{ t('avatar') }}</th>
          <th>{{ t('name') }}</th>
          <th>Email</th>
          <th>{{ t('source') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in customers" :key="customer.id" class="mfe-row" @click="open(customer)">
          <td>
            <img v-if="customer.avatarUrl" :src="customer.avatarUrl" :alt="customer.name" class="mfe-avatar" width="50" height="50" />
            <div v-else class="mfe-avatar mfe-avatar--empty">{{ (customer.name || '?').slice(0, 2).toUpperCase() }}</div>
          </td>
          <td class="mfe-strong">{{ customer.name }}</td>
          <td>{{ customer.email }}</td>
          <td>{{ customer.fromSource }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="isOpen && selected" class="mfe-drawer-backdrop" @click.self="close">
      <aside class="mfe-drawer">
        <h2>{{ t('about') }}</h2>

        <div class="mfe-avatar-block">
          <label class="mfe-avatar mfe-avatar--lg mfe-avatar--clickable" :title="t('avatarHint')">
            <img v-if="avatarUrlRef" :src="avatarUrlRef" :alt="nameRef" width="96" height="96" />
            <span v-else>{{ initials }}</span>
            <input type="file" accept="image/*" hidden :disabled="isAvatarSaving" @change="onAvatarFile" />
          </label>
          <button v-if="avatarUrlRef" type="button" class="mfe-link" :disabled="isAvatarSaving" @click="onAvatarRemove">
            {{ t('removeAvatar') }}
          </button>
        </div>

        <div class="mfe-fields">
          <input v-model="nameRef" type="text" class="mfe-input" :placeholder="t('namePh')" />
          <input v-model="emailRef" type="email" class="mfe-input" placeholder="Email" />
          <input v-model="fromSourceRef" type="text" class="mfe-input" :placeholder="t('sourcePh')" />
        </div>

        <p v-if="saveError" class="mfe-error">{{ saveError }}</p>

        <div class="mfe-actions">
          <button type="button" class="mfe-btn" :disabled="isSaving || !isDirty" @click="onSave">
            {{ isSaving ? t('saving') : t('save') }}
          </button>
          <button type="button" class="mfe-btn mfe-btn--ghost" @click="close">{{ t('close') }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mfe-customers { padding: 8px 4px; color: inherit; }
.mfe-title { font-weight: 700; font-size: 1.5rem; margin-bottom: 1.5rem; }
.mfe-muted { opacity: 0.65; }
.mfe-table { width: 100%; border-collapse: collapse; }
.mfe-table th, .mfe-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(127, 140, 160, 0.25); }
.mfe-row { cursor: pointer; }
.mfe-row:hover { background: rgba(255, 255, 255, 0.05); }
.mfe-strong { font-weight: 500; }
.mfe-avatar { width: 50px; height: 50px; border-radius: 9999px; object-fit: cover; display: inline-flex; align-items: center; justify-content: center; background: #1a2332; border: 1px solid #161c26; overflow: hidden; }
.mfe-avatar--lg { width: 96px; height: 96px; font-size: 1.5rem; }
.mfe-avatar--lg img { width: 96px; height: 96px; object-fit: cover; }
.mfe-avatar--clickable { cursor: pointer; }
.mfe-error { color: #f87171; font-size: 0.875rem; margin-top: 12px; }
.mfe-error-block { display: grid; gap: 12px; justify-items: start; }
.mfe-btn { background: #e8e8ef; color: #111; border-radius: 8px; padding: 8px 16px; font-weight: 600; border: none; cursor: pointer; }
.mfe-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mfe-btn--ghost { background: transparent; color: inherit; border: 1px solid rgba(127, 140, 160, 0.4); }
.mfe-link { background: none; border: none; color: #7aa2ff; cursor: pointer; font-size: 0.8rem; }
.mfe-drawer-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 60; display: flex; justify-content: flex-end; }
.mfe-drawer { width: min(420px, 100%); background: #0f141d; border-left: 1px solid #1c2534; padding: 24px; overflow-y: auto; }
.mfe-drawer h2 { font-size: 1.125rem; font-weight: 700; margin-bottom: 4px; }
.mfe-avatar-block { display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 20px 0; }
.mfe-fields { display: grid; gap: 12px; }
.mfe-input { background: transparent; border: 1px solid #161c26; border-radius: 8px; padding: 8px 12px; color: inherit; width: 100%; }
.mfe-actions { display: flex; gap: 12px; margin-top: 20px; }
</style>
