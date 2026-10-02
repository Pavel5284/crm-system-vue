<!-- поле пароля, :min-length="false" для логина чтобы не палить политику -->
<script setup lang="ts">
import type { Component } from 'vue'
import { createPasswordSchema } from '~/schemas/password.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  form: { Field: unknown }
  fieldName?: string
  minLength?: number | false
  placeholder?: string
  name?: string
  autocomplete?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'password',
  minLength: undefined,
  placeholder: undefined,
  name: 'password',
  autocomplete: 'current-password',
  disabled: false,
})

const { t } = useI18n()

const passwordSchema = createPasswordSchema(t, { minLength: props.minLength })
const passwordPlaceholder = computed(() => props.placeholder ?? t('validation.passwordPlaceholder'))

const FormField = props.form.Field as Component

const resolveError = (errors: unknown[]): string | undefined =>
  errors.length ? formatFieldErrors(errors) : undefined
</script>

<template>
  <FormField :name="props.fieldName" :validators="{ onChange: passwordSchema }" v-slot="{ field }">
    <div class="mb-2">
      <UiInputPassword
        :modelValue="field.state.value"
        :placeholder="passwordPlaceholder"
        :autocomplete="props.autocomplete"
        :name="props.name"
        :disabled="props.disabled"
        :error="resolveError(field.state.meta.errors)"
        @update:modelValue="(val: string | number) => field.handleChange(val as string)"
        @blur="field.handleBlur"
      />
    </div>
  </FormField>
</template>
