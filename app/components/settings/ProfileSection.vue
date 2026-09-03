<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { z } from 'zod'
import { getProfileApi, removeAvatarApi, updateAvatarApi, updateProfileApi } from '~/utils/auth.api.ts'

type ProfileFormValues = {
  name: string
  position: string
  phone: string
  telegram: string
}

const authStore = useAuthStore()

const avatarInitials = computed(() => {
  const name = authStore.user.name
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
  }
  return authStore.user.email?.[0]?.toUpperCase() ?? '?'
})

const { mutateAsync: updateAvatarMutate, isPending: isUpdateAvatarPending } = useMutation({
  mutationKey: ['profile', 'updateAvatar'],
  mutationFn: (dataUrl: string) => updateAvatarApi(dataUrl),
})

const { mutateAsync: removeAvatarMutate, isPending: isRemoveAvatarPending } = useMutation({
  mutationKey: ['profile', 'removeAvatar'],
  mutationFn: () => removeAvatarApi(),
})

const isAvatarSaving = computed(() => isUpdateAvatarPending.value || isRemoveAvatarPending.value)

const onAvatarUpload = async (dataUrl: string) => {
  try {
    const res = await updateAvatarMutate(dataUrl)
    if (res.success) {
      authStore.user.avatarUrl = dataUrl
    }
  } catch {
    // ошибка уже показана глобально через apiFetch toast
  }
}

const onAvatarRemove = async () => {
  try {
    const res = await removeAvatarMutate()
    if (res.success) {
      authStore.user.avatarUrl = null
    }
  } catch {
    // ошибка уже показана глобально
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(100, 'До 100 символов'),
  position: z.string().trim().max(100, 'До 100'),
  phone: z.string().trim().refine(v => !v || /^\+?[0-9\s\-()]{7,20}$/.test(v), 'Неверный телефон'),
  telegram: z.string().trim().refine(v => !v || /^@?[a-zA-Z0-9_]{3,32}$/.test(v), 'Неверный Telegram'),
})

const profileForm = useForm({
  defaultValues: {
    name: '',
    position: '',
    phone: '',
    telegram: '',
  } satisfies ProfileFormValues,
  validators: {
    onChange: profileSchema,
  },
  onSubmit: async ({ value }) => {
    const payload = {
      name: value.name.trim(),
      position: value.position.trim() || null,
      phone: value.phone.trim() || null,
      telegram: value.telegram.trim() || null,
    }
    const updated = await updateProfileApi(payload)
    authStore.set({ id: updated.id, email: updated.email, name: updated.name, status: true, avatarUrl: updated.avatarUrl, position: updated.position, phone: updated.phone, telegram: updated.telegram, isEmailVerified: updated.isEmailVerified })
    const init: ProfileFormValues = {
      name: value.name,
      position: value.position,
      phone: value.phone,
      telegram: value.telegram,
    }
    initialProfile.value = { ...init }
    profileForm.reset(init)
  },
})

const ProfileFormField = profileForm.Field

const isSaving = profileForm.useStore((state) => state.isSubmitting)

const initialProfile = ref<ProfileFormValues>({ name: '', position: '', phone: '', telegram: '' })

const formValues = profileForm.useStore((state) => state.values)

const isProfileDirty = computed(() => {
  const cur = formValues.value
  return cur.name !== initialProfile.value.name || cur.position !== initialProfile.value.position || cur.phone !== initialProfile.value.phone || cur.telegram !== initialProfile.value.telegram
})

const formatFieldError = (err: unknown): string => {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  try { return JSON.stringify(err) } catch { return String(err) }
}
const formatFieldErrors = (errors: unknown[]): string => errors.map(formatFieldError).join(', ')

const loadMe = async () => {
  try {
    const me = await getProfileApi()
    authStore.set({ id: me.id, email: me.email, name: me.name, status: true, avatarUrl: me.avatarUrl, position: me.position, phone: me.phone, telegram: me.telegram, isEmailVerified: me.isEmailVerified })
    const init: ProfileFormValues = {
      name: me.name,
      position: me.position ?? '',
      phone: me.phone ?? '',
      telegram: me.telegram ?? '',
    }
    initialProfile.value = { ...init }
    profileForm.reset(init)
  } catch {
    // 401 для /users/me|/profile - silent (см. api.ts), остальные - тост уже показан
  }
}

onMounted(loadMe)
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="px-6 py-4 border-b border-border">
      <h2 class="text-base font-semibold">Профиль</h2>
      <p class="text-xs text-muted-foreground">Фото, имя, должность и контакты</p>
    </div>

    <form class="p-6" @submit.prevent="() => profileForm.handleSubmit()">
      <div class="flex flex-col lg:flex-row gap-8">
        <div class="flex flex-col items-center text-center shrink-0 lg:w-56">
          <UiAvatarUploader v-model="authStore.user.avatarUrl" :initials="avatarInitials" :saving="isAvatarSaving" @upload="onAvatarUpload" @remove="onAvatarRemove" />
          <p class="mt-4 text-sm font-semibold">{{ authStore.user.name }}</p>
          <p class="text-xs text-muted-foreground">{{ authStore.user.email }}</p>
          <p v-if="authStore.user.position" class="text-xs text-muted-foreground mt-1">{{ authStore.user.position }}</p>
          <span v-if="authStore.user.isEmailVerified" class="mt-2 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Email подтверждён</span>
          <div class="mt-4 w-full text-left space-y-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-2"><Icon name="lucide:phone" size="14"/> <span>{{ authStore.user.phone || 'Телефон не указан' }}</span></div>
            <div class="flex items-center gap-2"><Icon name="lucide:send" size="14"/> <span>{{ authStore.user.telegram || 'Telegram не указан' }}</span></div>
          </div>
        </div>

        <!-- fields via TanStack Form -->
        <div class="flex-1 space-y-4 min-w-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField name="name" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Имя *</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" placeholder="Иван Иванов" autocomplete="name" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
              </div>
            </ProfileFormField>
            <ProfileFormField name="position" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Должность</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" placeholder="Product Manager" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
              </div>
            </ProfileFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField name="phone" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Телефон</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" placeholder="+79991234567" autocomplete="tel" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
                <p v-else class="text-[11px] text-muted-foreground mt-1">Формат: +7… 7-20 символов</p>
              </div>
            </ProfileFormField>
            <ProfileFormField name="telegram" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Telegram</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" placeholder="@username" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
                <p v-else class="text-[11px] text-muted-foreground mt-1">3-32 символа, a-z 0-9 _</p>
              </div>
            </ProfileFormField>
          </div>

          <div>
            <label class="text-xs font-medium">Email</label>
            <UiInput :model-value="authStore.user.email" disabled class="mt-1 opacity-70" />
            <p class="text-[11px] text-muted-foreground mt-1">Email меняется отдельно</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-6">
        <UiButton type="submit" :disabled="!isProfileDirty || isSaving">
          Сохранить
        </UiButton>
      </div>
    </form>
  </div>
</template>
