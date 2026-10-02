<script setup lang="ts">
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import { createRegisterSchema } from '~/schemas/auth.schema'
import { formatFieldErrors } from '~/utils/form-errors'
import {useRegister} from "~/composables/auth/useRegister.ts";

const { t } = useI18n()
const { register, isPending, serverError, successMessage } = useRegister()

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
    onChange: schema,
  },
  onSubmit: async ({ value }) => {
    const payload = {
      email: value.email.trim(),
      password: value.password,
      name: value.name.trim(),
    }
    // в деве без ключа капчи нет
    if (!turnstileSiteKey) {
      await register(payload)
      return
    }
    // капчу дергаем только после валидной формы
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
      // токен одноразовый
      turnstileRef.value?.reset()
    }
  },
})

const RegisterField = form.Field
const isSubmitting = form.useStore((state) => state.isSubmitting)
const formValues = form.useStore((state) => state.values)

const isSubmitDisabled = computed(() => isPending.value || isSubmitting.value || captchaPending.value)
</script>

<template>
  <div>
    <form v-if="!successMessage" autocomplete="on" @submit.prevent="() => form.handleSubmit()">
      <FormNameField :form="form" />

      <FormEmailField :form="form" />
      <FormPasswordField :form="form" name="new-password" autocomplete="new-password" />

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
