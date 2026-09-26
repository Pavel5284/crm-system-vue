<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { z } from 'zod'
import { getProfileApi, removeAvatarApi, updateAvatarApi, updateProfileApi } from '~/utils/auth.api.ts'
import { isPhoneDisplayValid, normalizePhone, phoneToPayload } from '~/utils/phone.ts'

const { t } = useI18n()

type ProfileFormValues = {
  name: string
  position: string
  phone: string
  telegram: string
}

const authStore = useAuthStore()

// Должности для выпадающего списка. value — канонические значения,
// сохраняемые в БД; labelKey — перевод для отображения.
const POSITION_DEFAULT = 'Менеджер'
const POSITION_OPTIONS = [
  { value: 'Менеджер', labelKey: 'settings.profile.positionOptions.manager' },
  { value: 'Старший менеджер', labelKey: 'settings.profile.positionOptions.seniorManager' },
  { value: 'Руководитель отдела', labelKey: 'settings.profile.positionOptions.headOfDepartment' },
  { value: 'Директор', labelKey: 'settings.profile.positionOptions.director' },
  { value: 'Администратор', labelKey: 'settings.profile.positionOptions.administrator' },
  { value: 'Технолог', labelKey: 'settings.profile.positionOptions.technologist' },
  { value: 'Логист', labelKey: 'settings.profile.positionOptions.logist' },
] as const

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
    void 0
  }
}

const onAvatarRemove = async () => {
  try {
    const res = await removeAvatarMutate()
    if (res.success) {
      authStore.user.avatarUrl = null
    }
  } catch {
    void 0
  }
}

const profileSchema = z.object({
  name: z.string().trim().min(2, t('settings.profile.validation.nameMin')).max(100, t('settings.profile.validation.nameMax')),
  position: z.string().trim().max(100, t('settings.profile.validation.positionMax')),
  phone: z.string().trim().refine(v => isPhoneDisplayValid(v), t('settings.profile.validation.phoneInvalid')),
  telegram: z.string().trim().refine(v => !v || /^@?[a-zA-Z0-9_]{3,32}$/.test(v), t('settings.profile.validation.telegramInvalid')),
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
      phone: phoneToPayload(value.phone),
      telegram: value.telegram.trim() || null,
    }
    const updated = await updateProfileApi(payload)
    authStore.set({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, status: true, avatarUrl: updated.avatarUrl, position: updated.position, phone: updated.phone, telegram: updated.telegram, isEmailVerified: updated.isEmailVerified })
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

// Старые произвольные значения должности, которых нет в списке,
// показываем как есть — чтобы не терять данные при загрузке.
const positionOptions = computed(() => {
  const cur = formValues.value.position?.trim()
  if (cur && !POSITION_OPTIONS.some((o) => o.value === cur)) {
    return [...POSITION_OPTIONS, { value: cur, labelKey: '' }]
  }
  return [...POSITION_OPTIONS]
})

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
    authStore.set({ id: me.id, email: me.email, name: me.name, role: me.role, status: true, avatarUrl: me.avatarUrl, position: me.position, phone: me.phone, telegram: me.telegram, isEmailVerified: me.isEmailVerified })
    const init: ProfileFormValues = {
      name: me.name,
      position: me.position?.trim() ? me.position : POSITION_DEFAULT,
      phone: normalizePhone(me.phone ?? ''),
      telegram: me.telegram ?? '',
    }
    initialProfile.value = { ...init }
    profileForm.reset(init)
  } catch {
    void 0
  }
}

onMounted(loadMe)
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <div class="px-6 py-4 border-b border-border">
      <h2 class="text-base font-semibold">{{ t('settings.profile.title') }}</h2>
      <p class="text-xs text-muted-foreground">{{ t('settings.profile.description') }}</p>
    </div>

    <form class="p-6" @submit.prevent="() => profileForm.handleSubmit()">
      <div class="flex flex-col lg:flex-row gap-8">
        <div class="flex flex-col items-center text-center shrink-0 lg:w-56">
          <UiAvatarUploader v-model="authStore.user.avatarUrl" :initials="avatarInitials" :saving="isAvatarSaving" @upload="onAvatarUpload" @remove="onAvatarRemove" />
          <p class="mt-4 text-sm font-semibold">{{ authStore.user.name }}</p>
          <p class="text-xs text-muted-foreground">{{ authStore.user.email }}</p>
          <p v-if="authStore.user.position" class="text-xs text-muted-foreground mt-1">{{ authStore.user.position }}</p>
          <span v-if="authStore.user.isEmailVerified" class="mt-2 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">{{ t('settings.profile.emailVerified') }}</span>
          <div class="mt-4 w-full text-left space-y-2 text-xs text-muted-foreground">
            <div class="flex items-center gap-2"><Icon name="lucide:phone" size="14"/> <span>{{ authStore.user.phone || t('settings.profile.phoneNotSpecified') }}</span></div>
            <div class="flex items-center gap-2"><Icon name="lucide:send" size="14"/> <span>{{ authStore.user.telegram || t('settings.profile.telegramNotSpecified') }}</span></div>
          </div>
        </div>

        <div class="flex-1 space-y-4 min-w-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField name="name" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">{{ t('settings.profile.nameLabel') }}</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" :placeholder="t('settings.profile.namePlaceholder')" autocomplete="name" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
              </div>
            </ProfileFormField>
            <ProfileFormField name="position" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">{{ t('settings.profile.positionLabel') }}</label>
                <select
                  :value="field.state.value"
                  @change="(e: Event) => { field.handleChange((e.target as HTMLSelectElement).value); field.handleBlur() }"
                  class="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option v-for="o in positionOptions" :key="o.value" :value="o.value">
                    {{ o.labelKey ? t(o.labelKey) : o.value }}
                  </option>
                </select>
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
              </div>
            </ProfileFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileFormField name="phone" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">{{ t('settings.profile.phoneLabel') }}</label>
                <UiPhoneInput :model-value="field.state.value" @update:model-value="field.handleChange" @blur="field.handleBlur" :placeholder="t('settings.profile.phonePlaceholder')" :error="formatFieldErrors(field.state.meta.errors)" :hint="t('settings.profile.phoneHint')" class="mt-1" />
              </div>
            </ProfileFormField>
            <ProfileFormField name="telegram" v-slot="{ field }">
              <div>
                <label class="text-xs font-medium">Telegram</label>
                <UiInput :modelValue="field.state.value" @update:modelValue="(val: string | number) => field.handleChange(val as string)" @blur="field.handleBlur" :placeholder="t('settings.profile.telegramPlaceholder')" class="mt-1" />
                <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
                <p v-else class="text-[11px] text-muted-foreground mt-1">{{ t('settings.profile.telegramHint') }}</p>
              </div>
            </ProfileFormField>
          </div>

          <div>
            <label class="text-xs font-medium">{{ t('settings.profile.emailLabel') }}</label>
            <UiInput :model-value="authStore.user.email" disabled class="mt-1 opacity-70" />
            <p class="text-[11px] text-muted-foreground mt-1">{{ t('settings.profile.emailHint') }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-6">
        <UiButton type="submit" :disabled="!isProfileDirty || isSaving">
          {{ t('settings.profile.save') }}
        </UiButton>
      </div>
    </form>
  </div>
</template>

