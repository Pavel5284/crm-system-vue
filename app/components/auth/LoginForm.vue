<script setup lang="ts">
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import { createLoginSchema } from '~/schemas/auth.schema'
import { useLogin } from '~/composables/auth/useLogin'

const { t } = useI18n()
const { login, isPending, serverError } = useLogin()

const schema = createLoginSchema(t)

const form = useTanStackForm({
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    // Один прогон: onChange-ошибки TanStack перепроверяет и на сабмите.
    onChange: schema,
  },
  // Сюда попадаем только при валидной форме.
  onSubmit: async ({ value }) => {
    await login({ email: value.email.trim(), password: value.password })
  },
})

const LoginField = form.Field
const isSubmitting = form.useStore((state) => state.isSubmitting)

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

const isSubmitDisabled = computed(() => isPending.value || isSubmitting.value)
</script>

<template>
  <div>
    <form autocomplete="on" @submit.prevent="() => form.handleSubmit()">
      <LoginField name="email" v-slot="{ field }">
        <div class="mb-2">
          <UiInput
            :modelValue="field.state.value"
            :placeholder="t('login.emailPlaceholder')"
            type="email"
            autocomplete="email"
            name="email"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </LoginField>

      <LoginField name="password" v-slot="{ field }">
        <div class="mb-2">
          <UiInputPassword
            :modelValue="field.state.value"
            :placeholder="t('login.passwordPlaceholder')"
            autocomplete="current-password"
            name="password"
            :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
            @update:modelValue="(val: string | number) => field.handleChange(val as string)"
            @blur="field.handleBlur"
          />
        </div>
      </LoginField>

      <div class="flex flex-col items-center gap-3">
        <UiButton type="submit" :disabled="isSubmitDisabled">
          {{ t('login.loginButton') }}
        </UiButton>
        <NuxtLink to="/register" class="text-sm text-muted-foreground hover:text-white">
          {{ t('login.noAccount') }}
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
