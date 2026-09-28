<!--
  FormPasswordField — поле пароля TanStack-формы с зашитой валидацией.

  Как пользоваться:
    <FormPasswordField :form="form" /> — минимум 8 по умолчанию
    <FormPasswordField :form="form" :min-length="false" /> — логин: без минимума

  Что происходит внутри:
    1. FormField регистрирует поле в родительской форме и при каждом вводе
       прогоняет его через правило passwordSchema (zod).
    2. Найденные ошибки лежат в field.state.meta.errors.
    3. resolveError() превращает их в строку для UiInputPassword, тот рисует
       красную рамку и текст под инпутом.
-->
<script setup lang="ts">
import type { Component } from 'vue'
import { createPasswordSchema } from '~/schemas/password.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  // Форма, которой принадлежит поле (результат useForm() родителя).
  // От нее нужен только компонент Field — он связывает инпут со стейтом формы.
  form: { Field: unknown }
  // Ключ поля в значениях формы (form.state.values[fieldName]).
  fieldName?: string
  // Политика минимума: false — без проверки (логин, политику не раскрываем),
  // число — свой минимум, по умолчанию 8.
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

// Правило валидации (zod). Применяется ниже через :validators.
const passwordSchema = createPasswordSchema(t, { minLength: props.minLength })
const passwordPlaceholder = computed(() => props.placeholder ?? t('validation.passwordPlaceholder'))

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
  <FormField :name="props.fieldName" :validators="{ onChange: passwordSchema }" v-slot="{ field }">
    <div class="mb-2">
      <!-- UiInputPassword умеет string | number, а поле хранит string — отсюда val as string. -->
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
