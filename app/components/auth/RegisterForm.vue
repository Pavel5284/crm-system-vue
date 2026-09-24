<script setup lang="ts">
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import { createRegisterSchema } from '~/schemas/auth.schema'
import {useRegister} from "~/composables/auth/useRegister.ts";

const { t } = useI18n()
const { register, isPending, serverError, successMessage } = useRegister()

// siteKey читаем напрямую из конфига — сам виджет живет в TurnstileWidget
// (невидимый, рендерится скрытым). onSubmit срабатывает только при валидной
// форме: сначала execute() капчи, запрос на бэк — только с токеном.
const turnstileSiteKey = (useRuntimeConfig().public.turnstileSiteKey || '') as string
const turnstileRef = ref<{ execute: () => Promise<string>, reset: () => void } | null>(null)
const captchaPending = ref(false)

const schema = createRegisterSchema(t)

const form = useTanStackForm({
  defaultValues: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  validators: {
    // Один прогон: onChange-ошибки TanStack перепроверяет и на сабмите,
    // второй валидатор здесь же давал тот же текст дважды в meta.errors.
    onChange: schema,
  },
  onSubmit: async ({ value }) => {
    const payload = {
      email: value.email.trim(),
      password: value.password,
      name: value.name.trim(),
    }
    // Без site key (dev) капчи нет — сразу в бэкенд.
    if (!turnstileSiteKey) {
      await register(payload)
      return
    }
    // Капча только после валидной формы и клика: сначала токен, потом запрос.
    let captchaToken = ''
    captchaPending.value = true
    try {
      captchaToken = (await turnstileRef.value?.execute()) ?? ''
    }
    catch {
      serverError.value = t('register.captchaRequired')
      return
    }
    finally {
      captchaPending.value = false
    }
    if (!captchaToken) {
      serverError.value = t('register.captchaRequired')
      return
    }
    try {
      await register({ ...payload, captchaToken })
    }
    finally {
      // Токен Turnstile одноразовый — сбрасываем после каждой попытки.
      turnstileRef.value?.reset()
    }
  },
})

const RegisterField = form.Field
const isSubmitting = form.useStore((state) => state.isSubmitting)
const formValues = form.useStore((state) => state.values)

const formatFieldError = (err: unknown): string => {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  try {
    return JSON.stringify(err)
  }
  catch {
    return String(err)
  }
}
const formatFieldErrors = (errors: unknown[]): string => [...new Set(errors.map(formatFieldError))].join(', ')

const isSubmitDisabled = computed(() => isPending.value || isSubmitting.value || captchaPending.value)
</script>

<template>
  <div>
    <form v-if="!successMessage" autocomplete="on" @submit.prevent="() => form.handleSubmit()">
      <RegisterField name="name" v-slot="{ field }">
        <div class="mb-2">
          <UiInput
            :modelValue="field.state.value"
            :placeholder="t('register.namePlaceholder')"
            type="text"
            autocomplete="name"
            name="name"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </RegisterField>

      <RegisterField name="email" v-slot="{ field }">
        <div class="mb-2">
          <UiInput
            :modelValue="field.state.value"
            :placeholder="t('register.emailPlaceholder')"
            type="email"
            autocomplete="email"
            name="email"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </RegisterField>

      <RegisterField name="password" v-slot="{ field }">
        <div class="mb-2">
          <UiInputPassword
            :modelValue="field.state.value"
            :placeholder="t('register.passwordPlaceholder')"
            autocomplete="new-password"
            name="new-password"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </RegisterField>

      <RegisterField name="confirmPassword" v-slot="{ field }">
        <div class="mb-2">
          <UiInputPassword
            :modelValue="field.state.value"
            :placeholder="t('register.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            name="confirm-password"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </RegisterField>

      <AuthTurnstileWidget ref="turnstileRef" />

      <div class="flex flex-col items-center gap-3">
        <UiButton type="submit" :disabled="isSubmitDisabled">
          {{ captchaPending ? t('register.captchaVerifying') : t('register.registerButton') }}
        </UiButton>
        <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
          {{ t('register.haveAccount') }}
        </NuxtLink>
      </div>
    </form>

    <AuthResendVerification
      v-else
      :email="formValues.email"
      @resent="(msg: string) => { successMessage = msg }"
    />
  </div>
</template>
