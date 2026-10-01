<!--
  FormEmailField — email-поле TanStack-формы с зашитой валидацией.

  Как пользоваться:
    <FormEmailField :form="form" />

  Что происходит внутри:
    1. FormField регистрирует поле в родительской форме и при каждом вводе
       прогоняет его через правило emailSchema (zod).
    2. Найденные ошибки лежат в field.state.meta.errors.
    3. resolveError() превращает их в строку для UiInput, тот рисует
       красную рамку и текст под инпутом.
-->
<script setup lang="ts">
import type { Component } from 'vue'
import { createEmailSchema } from '~/schemas/email.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  // Форма, которой принадлежит поле (результат useForm() родителя).
  // От нее нужен только компонент Field — он связывает инпут со стейтом формы.
  form: { Field: unknown }
  // Ключ поля в значениях формы (form.state.values[fieldName]).
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

// Правило валидации (zod). Применяется ниже через :validators.
const emailSchema = createEmailSchema(t)
const emailPlaceholder = computed(() => props.placeholder ?? t('validation.emailPlaceholder'))

// Компонент поля той формы, что передали в :form.
// Каст нужен, потому что полный тип Field у TanStack — 20+ дженериков,
// а нам важно лишь одно: это Vue-компонент.
const FormField = props.form.Field as Component

// Текст ошибки под инпутом. Пока поле валидно — undefined, и ошибка скрыта.
const resolveError = (errors: unknown[]): string | undefined =>
  errors.length ? formatFieldErrors(errors) : undefined
</script>

<template>
  <!--
    :name — под каким ключом поле живет в форме.
    :validators — правило, которое TanStack прогоняет при каждом вводе (onChange).
    v-slot="{ field }" — API поля: текущее значение (field.state.value),
      ошибки (field.state.meta.errors) и обработчики (handleChange/handleBlur).
  -->
  <FormField :name="props.fieldName" :validators="{ onChange: emailSchema }" v-slot="{ field }">
    <div class="mb-2">
      <!-- UiInput умеет string | number, а поле хранит string — отсюда val as string. -->
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
