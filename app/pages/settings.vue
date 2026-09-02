<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getProfileApi, getVisitsApi, removeAvatarApi, updateAvatarApi, updateProfileApi, type Visit } from '~/utils/auth.api'

useSeoMeta({ title: 'Settings | CRM System' })

const authStore = useAuthStore()
const toast = useToast()

const isSaving = ref(false)
const errorRef = ref('')
const successRef = ref('')

const nameRef = ref('')
const positionRef = ref('')
const phoneRef = ref('')
const telegramRef = ref('')
const avatarUrlRef = ref<string | null>(null)
const avatarPreview = ref<string | null>(null)

const visits = ref<Visit[]>([])
const visitsLoading = ref(false)

const initials = computed(() => {
  const name = nameRef.value.trim() || authStore.user.name
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return authStore.user.email[0]?.toUpperCase() ?? '?'
})

const loadMe = async () => {
  try {
    const me = await getProfileApi()
    authStore.set({ email: me.email, name: me.name, status: true, avatarUrl: me.avatarUrl, position: me.position, phone: me.phone, telegram: me.telegram, isEmailVerified: me.isEmailVerified })
    nameRef.value = me.name
    positionRef.value = me.position ?? ''
    phoneRef.value = me.phone ?? ''
    telegramRef.value = me.telegram ?? ''
    avatarUrlRef.value = me.avatarUrl
    avatarPreview.value = me.avatarUrl
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  }
}

const loadVisits = async () => {
  visitsLoading.value = true
  try {
    visits.value = await getVisitsApi()
  } catch {
    // гость или нет прав — тихо
  } finally {
    visitsLoading.value = false
  }
}

onMounted(async () => {
  await loadMe()
  await loadVisits()
})

const isAvatarSaving = ref(false)

const onAvatarChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    errorRef.value = 'Фото до 2MB'
    return
  }
  if (!file.type.startsWith('image/')) {
    errorRef.value = 'Только изображения'
    return
  }
  const reader = new FileReader()
  reader.onload = async () => {
    const dataUrl = String(reader.result)
    avatarPreview.value = dataUrl
    avatarUrlRef.value = dataUrl
    // отдельный эндпоинт: возвращает только {success}
    isAvatarSaving.value = true
    errorRef.value = ''
    try {
      const res = await updateAvatarApi(dataUrl)
      if (res.success) {
        authStore.user.avatarUrl = dataUrl
        toast.add({ title: 'Фото обновлено', color: 'success' })
      }
    } catch (err) {
      errorRef.value = getApiErrorMessage(err)
      avatarPreview.value = authStore.user.avatarUrl
      avatarUrlRef.value = authStore.user.avatarUrl
    } finally {
      isAvatarSaving.value = false
      ;(e.target as HTMLInputElement).value = ''
    }
  }
  reader.readAsDataURL(file)
}

const removeAvatar = async () => {
  isAvatarSaving.value = true
  errorRef.value = ''
  try {
    const res = await removeAvatarApi()
    if (res.success) {
      authStore.user.avatarUrl = null
      avatarPreview.value = null
      avatarUrlRef.value = null
      toast.add({ title: 'Фото удалено', color: 'success' })
    }
  } catch (err) {
    errorRef.value = getApiErrorMessage(err)
  } finally {
    isAvatarSaving.value = false
  }
}

const saveProfile = async () => {
  errorRef.value = ''
  successRef.value = ''
  if (!nameRef.value.trim()) {
    errorRef.value = 'Имя не может быть пустым'
    return
  }
  // базовая валидация телефона/тг (строже проверит бэк)
  if (phoneRef.value && !/^\+?[0-9\s\-()]{7,20}$/.test(phoneRef.value.trim())) {
    errorRef.value = 'Неверный формат телефона'
    return
  }
  if (telegramRef.value && !/^@?[a-zA-Z0-9_]{3,32}$/.test(telegramRef.value.trim())) {
    errorRef.value = 'Неверный формат Telegram (3-32, a-z 0-9 _)'
    return
  }
  isSaving.value = true
  try {
    // аватар теперь отдельным эндпоинтом PATCH /users/profile/avatar
    const payload: Record<string, unknown> = {
      name: nameRef.value.trim(),
      position: positionRef.value.trim() || null,
      phone: phoneRef.value.trim() || null,
      telegram: telegramRef.value.trim() || null,
    }
    const updated = await updateProfileApi(payload as any)
    authStore.set({ email: updated.email, name: updated.name, status: true, avatarUrl: updated.avatarUrl, position: updated.position, phone: updated.phone, telegram: updated.telegram, isEmailVerified: updated.isEmailVerified })
    successRef.value = 'Профиль сохранён'
    toast.add({ title: 'Сохранено', description: 'Профиль обновлён', color: 'success' })
  } catch (e) {
    console.error('[settings] saveProfile failed', e)
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}
</script>

<template>
  <div class="max-w-5xl mx-auto p-1">
    <h1 class="text-2xl font-bold mb-6">Настройки</h1>

    <p v-if="errorRef" class="text-red-500 text-sm mb-3">{{ errorRef }}</p>
    <p v-if="successRef" class="text-green-600 text-sm mb-3">{{ successRef }}</p>

    <div class="space-y-6">
        <div class="rounded-lg border border-border bg-card">
          <div class="px-6 py-4 border-b border-border">
            <h2 class="text-base font-semibold">Профиль</h2>
            <p class="text-xs text-muted-foreground">Фото, имя, должность и контакты</p>
          </div>
          <form class="p-6" @submit.prevent="saveProfile">
            <div class="flex flex-col lg:flex-row gap-8">
              <!-- avatar -->
              <div class="flex flex-col items-center text-center shrink-0 lg:w-56">
                <div class="relative">
                  <img
                    v-if="avatarPreview"
                    :src="avatarPreview"
                    alt="avatar"
                    class="h-28 w-28 rounded-full object-cover border-2 border-border"
                  />
                  <div v-else class="h-28 w-28 rounded-full bg-primary text-primary-foreground grid place-items-center text-3xl font-bold">
                    {{ initials }}
                  </div>
                  <label :class="['absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow hover:opacity-90 transition-opacity', isAvatarSaving && 'opacity-50 pointer-events-none']" title="Загрузить фото">
                    <Icon :name="isAvatarSaving ? 'lucide:loader-2' : 'lucide:camera'" size="16" :class="isAvatarSaving && 'animate-spin'" />
                    <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" :disabled="isAvatarSaving" />
                  </label>
                </div>
                <p class="mt-4 text-sm font-semibold">{{ authStore.user.name }}</p>
                <p class="text-xs text-muted-foreground">{{ authStore.user.email }}</p>
                <p v-if="authStore.user.position" class="text-xs text-muted-foreground mt-1">{{ authStore.user.position }}</p>
                <div class="mt-3 flex flex-wrap justify-center gap-2">
                  <button v-if="avatarPreview" type="button" class="text-xs text-red-500 hover:underline disabled:opacity-50" :disabled="isAvatarSaving" @click="removeAvatar">Удалить фото</button>
                  <span v-if="authStore.user.isEmailVerified" class="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Email подтверждён</span>
                </div>
                <div class="mt-4 w-full text-left space-y-2 text-xs text-muted-foreground">
                  <div class="flex items-center gap-2"><Icon name="lucide:phone" size="14"/> <span>{{ authStore.user.phone || 'Телефон не указан' }}</span></div>
                  <div class="flex items-center gap-2"><Icon name="lucide:send" size="14"/> <span>{{ authStore.user.telegram || 'Telegram не указан' }}</span></div>
                </div>
              </div>

              <!-- fields -->
              <div class="flex-1 space-y-4 min-w-0">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-medium">Имя *</label>
                    <UiInput v-model="nameRef" placeholder="Иван Иванов" autocomplete="name" class="mt-1" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Должность</label>
                    <UiInput v-model="positionRef" placeholder="Product Manager" class="mt-1" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="text-xs font-medium">Телефон</label>
                    <UiInput v-model="phoneRef" placeholder="+79991234567" autocomplete="tel" class="mt-1" />
                    <p class="text-[11px] text-muted-foreground mt-1">Формат: +7… 7-20 символов</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium">Telegram</label>
                    <UiInput v-model="telegramRef" placeholder="@username" class="mt-1" />
                    <p class="text-[11px] text-muted-foreground mt-1">3-32 символа, a-z 0-9 _</p>
                  </div>
                </div>

                <div>
                  <label class="text-xs font-medium">Email</label>
                  <UiInput :model-value="authStore.user.email" disabled class="mt-1 opacity-70" />
                  <p class="text-[11px] text-muted-foreground mt-1">Email меняется отдельно</p>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-6">
              <UiButton type="submit" :disabled="isSaving">
                <span v-if="isSaving">Сохранение…</span>
                <span v-else>Сохранить</span>
              </UiButton>
            </div>
          </form>
        </div>

        <div class="rounded-lg border border-border bg-card">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold">История посещений</h2>
              <p class="text-xs text-muted-foreground">Когда, устройство, браузер, IP</p>
            </div>
            <UiButton variant="outline" size="sm" @click="loadVisits" :disabled="visitsLoading">Обновить</UiButton>
          </div>

          <div v-if="visitsLoading" class="p-6 text-sm text-muted-foreground">Загрузка…</div>
          <div v-else-if="!visits.length" class="p-6 text-sm text-muted-foreground text-center">Пока нет записей (войдите заново чтобы создать визит)</div>
          <div v-else class="overflow-auto">
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
              <tbody>
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
        </div>
      </div>
    </div>
</template>
