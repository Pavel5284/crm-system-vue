<!--
  FormTelegramField — поле Telegram TanStack-формы с зашитой валидацией.

  Как пользоваться:
    <FormTelegramField :form="profileForm" :placeholder="t('...telegramPlaceholder')" :hint="t('...telegramHint')" />

  Что происходит внутри:
    1. FormField регистрирует поле в родительской форме и при каждом вводе
       прогоняет его через правило telegramSchema (zod: пусто либо @ + 3-32
       символа a-z 0-9 _).
    2. Найденные ошибки лежат в field.state.meta.errors и рисуются под инпутом.
       Пока ошибок нет — вместо них показывается подсказка hint (если передана).
-->
<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { createTelegramSchema } from '~/schemas/telegram.schema'
import { formatFieldErrors } from '~/utils/form-errors'

interface Props {
  // Форма, которой принадлежит поле (результат useForm() родителя).
  // От нее нужен только компонент Field — он связывает инпут со стейтом формы.
  form: { Field: unknown }
  // Ключ поля в значениях формы (form.state.values[fieldName]).
  fieldName?: string
  placeholder?: string
  // Подсказка под инпутом. Видна, только пока нет ошибок.
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

// Правило валидации (zod). Применяется ниже через :validators.
const telegramSchema = createTelegramSchema(t)

// Компонент поля той формы, что передали в :form.
// Каст нужен, потому что полный тип Field у TanStack — 20+ дженериков,
// а нам важно лишь одно: это Vue-компонент.
const FormField = props.form.Field as Component
</script>

<template>
  <!--
    :name — под каким ключом поле живет в форме.
    :validators — правило, которое TanStack прогоняет при каждом вводе (onChange).
    v-slot="{ field }" — API поля: текущее значение (field.state.value),
      ошибки (field.state.meta.errors) и обработчики (handleChange/handleBlur).
  -->
  <FormField :name="props.fieldName" :validators="{ onChange: telegramSchema }" v-slot="{ field }">
    <div>
      <!-- UiInput умеет string | number, а поле хранит string — отсюда val as string. -->
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
