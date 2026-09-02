<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { z } from 'zod'
import { getApiErrorMessage } from '~/utils/api.ts'
import { getProfileApi, removeAvatarApi, updateAvatarApi, updateProfileApi } from '~/utils/auth.api.ts'

const authStore = useAuthStore()
const toast = useToast()

const errorRef = ref('')
const successRef = ref('')

const avatarUrlRef = ref<string | null>(null)
const avatarPreview = ref<string | null>(null)
const isAvatarSaving = ref(false)

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(100, 'До 100 символов'),
  position: z.string().trim().max(100, 'До 100').optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')).refine(v => !v || /^\+?[0-9\s\-()]{7,20}$/.test(v), 'Неверный телефон'),
  telegram: z.string().trim().optional().or(z.literal('')).refine(v => !v || /^@?[a-zA-Z0-9_]{3,32}$/.test(v), 'Неверный Telegram'),
})

const profileForm = useForm({
  defaultValues: {
    name: '',
    position: '',
    phone: '',
    telegram: '',
  },
  validators: {
    onChange: profileSchema,
  },
  onSubmit: async ({ value }) => {
    errorRef.value = ''
    successRef.value = ''
    try {
      const payload = {
        name: value.name.trim(),
        position: value.position.trim() || null,
        phone: value.phone.trim() || null,
        telegram: value.telegram.trim() || null,
      }
      const updated = await updateProfileApi(payload as any)
      authStore.set({ email: updated.email, name: updated.name, status: true, avatarUrl: updated.avatarUrl, position: updated.position, phone: updated.phone, telegram: updated.telegram, isEmailVerified: updated.isEmailVerified })
      successRef.value = 'Профиль сохранён'
      toast.add({ title: 'Сохранено', description: 'Профиль обновлён', color: 'success' })
    } catch (e) {
      console.error('[profile] save failed', e)
      errorRef.value = getApiErrorMessage(e)
      throw e
    }
  },
})

const initials = computed(() => {
  const name = (profileForm.getFieldValue('name') as string)?.trim() || authStore.user.name
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
    profileForm.setFieldValue('name', me.name)
    profileForm.setFieldValue('position', me.position ?? '')
    profileForm.setFieldValue('phone', me.phone ?? '')
    profileForm.setFieldValue('telegram', me.telegram ?? '')
    avatarUrlRef.value = me.avatarUrl
    avatarPreview.value = me.avatarUrl
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  }
}

onMounted(loadMe)

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
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="px-6 py-4 border-b border-border">
      <h2 class="text-base font-semibold">Профиль</h2>
      <p class="text-xs text-muted-foreground">Фото, имя, должность и контакты — валидация TanStack Form + Zod</p>
    </div>

    <p v-if="errorRef" class="text-red-500 text-sm px-6 pt-3">{{ errorRef }}</p>
    <p v-if="successRef" class="text-green-600 text-sm px-6 pt-3">{{ successRef }}</p>

    <form class="p-6" @submit.prevent="() => profileForm.handleSubmit()">
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

        <!-- fields via TanStack Form -->
        <div class="flex-1 space-y-4 min-w-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <profileForm.Field name="name" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Имя *</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="field.handleChange" @blur="field.handleBlur" placeholder="Иван Иванов" autocomplete="name" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ field.state.meta.errors.map((e:any)=> typeof e==='string'?e:e?.message||JSON.stringify(e)).join(', ') }}</p>
              </div>
            </profileForm.Field>
            <profileForm.Field name="position" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Должность</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="field.handleChange" @blur="field.handleBlur" placeholder="Product Manager" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ field.state.meta.errors.map((e:any)=> typeof e==='string'?e:e?.message||JSON.stringify(e)).join(', ') }}</p>
              </div>
            </profileForm.Field>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <profileForm.Field name="phone" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Телефон</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="field.handleChange" @blur="field.handleBlur" placeholder="+79991234567" autocomplete="tel" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ field.state.meta.errors.map((e:any)=> typeof e==='string'?e:e?.message||JSON.stringify(e)).join(', ') }}</p>
                <p v-else class="text-[11px] text-muted-foreground mt-1">Формат: +7… 7-20 символов</p>
              </div>
            </profileForm.Field>
            <profileForm.Field name="telegram" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Telegram</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="field.handleChange" @blur="field.handleBlur" placeholder="@username" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ field.state.meta.errors.map((e:any)=> typeof e==='string'?e:e?.message||JSON.stringify(e)).join(', ') }}</p>
                <p v-else class="text-[11px] text-muted-foreground mt-1">3-32 символа, a-z 0-9 _</p>
              </div>
            </profileForm.Field>
          </div>

          <div>
            <label class="text-xs font-medium">Email</label>
            <UiInput :model-value="authStore.user.email" disabled class="mt-1 opacity-70" />
            <p class="text-[11px] text-muted-foreground mt-1">Email меняется отдельно</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-6">
        <UiButton type="submit" :disabled="!profileForm.state.canSubmit || profileForm.state.isSubmitting">
          <span v-if="profileForm.state.isSubmitting">Сохранение…</span>
          <span v-else>Сохранить</span>
        </UiButton>
      </div>
    </form>
  </div>
</template>
