<script setup lang="ts">
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import { createLoginSchema } from '~/schemas/auth.schema'
import { useLogin } from '~/composables/auth/useLogin'

const { t } = useI18n()
const { login, isPending} = useLogin()

// Демо-режим (NUXT_PUBLIC_DEMO_MODE=true): ссылка на регистрацию скрыта,
// вместо неё — пометка. Сама регистрация закрыта и на бэкенде (DEMO_MODE).
const demoMode = (useRuntimeConfig() as { public: { demoMode?: boolean } }).public.demoMode

const schema = createLoginSchema(t)

const form = useTanStackForm({
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    onChange: schema,
  },
  onSubmit: async ({ value }) => {
    await login({ email: value.email.trim(), password: value.password })
  },
})

const isSubmitting = form.useStore((state) => state.isSubmitting)

const isSubmitDisabled = computed(() => isPending.value || isSubmitting.value)
</script>

<template>
  <div>
    <form autocomplete="on" @submit.prevent="() => form.handleSubmit()">
      <FormEmailField :form="form" />
      <FormPasswordField :form="form" :min-length="false" />

      <div class="flex flex-col items-center gap-3">
        <UiButton type="submit" :disabled="isSubmitDisabled">
          {{ t('login.loginButton') }}
        </UiButton>
        <NuxtLink v-if="!demoMode" to="/register" class="text-sm text-muted-foreground hover:text-white">
          {{ t('login.noAccount') }}
        </NuxtLink>
        <p v-else class="text-sm text-muted-foreground">
          {{ t('login.demoModeNotice') }}
        </p>
      </div>
    </form>
  </div>
</template>
