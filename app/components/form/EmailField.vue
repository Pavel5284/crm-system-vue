<!-- email-поле, валидация зашита внутри -->
<script setup lang="ts">
import type { Component } from 'vue'
import { createEmailSchema } from '~/schemas/email.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  form: { Field: unknown }
  fieldName?: string
  placeholder?: string
  name?: string
  autocomplete?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'email',
  placeholder: undefined,
  name: 'email',
  autocomplete: 'email',
  disabled: false,
})

const { t } = useI18n()

const emailSchema = createEmailSchema(t)
const emailPlaceholder = computed(() => props.placeholder ?? t('validation.emailPlaceholder'))

// у tanstack тип Field на 20 дженериков, нам нужен просто компонент
const FormField = props.form.Field as Component

const resolveError = (errors: unknown[]): string | undefined =>
  errors.length ? formatFieldErrors(errors) : undefined
</script>

<template>
  <FormField :name="props.fieldName" :validators="{ onChange: emailSchema }" v-slot="{ field }">
    <div class="mb-2">
      <UiInput
        :modelValue="field.state.value"
        :placeholder="emailPlaceholder"
        type="email"
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
