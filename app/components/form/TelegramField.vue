<!-- поле телеграма -->
<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { createTelegramSchema } from '~/schemas/telegram.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  form: { Field: unknown }
  fieldName?: string
  placeholder?: string
  hint?: string
  name?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'telegram',
  placeholder: undefined,
  hint: undefined,
  name: 'telegram',
  disabled: false,
  class: undefined,
})

const { t } = useI18n()

const telegramSchema = createTelegramSchema(t)

const FormField = props.form.Field as Component
</script>

<template>
  <FormField :name="props.fieldName" :validators="{ onChange: telegramSchema }" v-slot="{ field }">
    <div>
      <UiInput
        :modelValue="field.state.value"
        :placeholder="props.placeholder"
        type="text"
        :name="props.name"
        :disabled="props.disabled"
        :class="props.class"
        :error="field.state.meta.errors.length ? formatFieldErrors(field.state.meta.errors) : undefined"
        @update:modelValue="(val: string | number) => field.handleChange(val as string)"
        @blur="field.handleBlur"
      />
      <p v-if="!field.state.meta.errors.length && props.hint" class="text-[11px] text-muted-foreground mt-1">{{ props.hint }}</p>
    </div>
  </FormField>
</template>
