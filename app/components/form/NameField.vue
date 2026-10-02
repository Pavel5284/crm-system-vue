<!-- обычное текстовое поле для имени -->
<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { createNameSchema } from '~/schemas/name.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  form: { Field: unknown }
  fieldName?: string
  maxLength?: number
  placeholder?: string
  name?: string
  autocomplete?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'name',
  maxLength: undefined,
  placeholder: undefined,
  name: 'name',
  autocomplete: 'name',
  disabled: false,
  class: undefined,
})

const { t } = useI18n()

const nameSchema = createNameSchema(t, { maxLength: props.maxLength })
const namePlaceholder = computed(() => props.placeholder ?? t('validation.namePlaceholder'))

const FormField = props.form.Field as Component

const resolveError = (errors: unknown[]): string | undefined =>
  errors.length ? formatFieldErrors(errors) : undefined
</script>

<template>
  <FormField :name="props.fieldName" :validators="{ onChange: nameSchema }" v-slot="{ field }">
    <div class="mb-2">
      <UiInput
        :modelValue="field.state.value"
        :placeholder="namePlaceholder"
        type="text"
        :autocomplete="props.autocomplete"
        :name="props.name"
        :disabled="props.disabled"
        :class="props.class"
        :error="resolveError(field.state.meta.errors)"
        @update:modelValue="(val: string | number) => field.handleChange(val as string)"
        @blur="field.handleBlur"
      />
    </div>
  </FormField>
</template>
