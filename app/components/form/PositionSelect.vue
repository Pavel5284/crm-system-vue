<!--
  PositionSelect — поле должности TanStack-формы с зашитой валидацией.

  Как пользоваться:
    <FormPositionSelect :form="profileForm" />

  Что происходит внутри:
    1. FormField регистрирует поле в родительской форме и при каждом вводе
       прогоняет его через правило positionSchema (zod: макс. 100 символов).
    2. Найденные ошибки лежат в field.state.meta.errors и рисуются под селектом.
    3. Старое произвольное значение, которого нет в списке, подмешивается
       в опции как есть — чтобы не терять данные при загрузке.
-->
<script setup lang="ts">
import type { Component } from 'vue'
import { z } from 'zod'
import { formatFieldErrors } from '~/utils/form-errors'

interface PositionOption {
  value: string
  labelKey?: string
}

// Канонические значения, сохраняемые в БД; labelKey — перевод для отображения.
const POSITION_OPTIONS: PositionOption[] = [
  { value: 'Менеджер', labelKey: 'settings.profile.positionOptions.manager' },
  { value: 'Старший менеджер', labelKey: 'settings.profile.positionOptions.seniorManager' },
  { value: 'Руководитель отдела', labelKey: 'settings.profile.positionOptions.headOfDepartment' },
  { value: 'Директор', labelKey: 'settings.profile.positionOptions.director' },
  { value: 'Администратор', labelKey: 'settings.profile.positionOptions.administrator' },
  { value: 'Технолог', labelKey: 'settings.profile.positionOptions.technologist' },
  { value: 'Логист', labelKey: 'settings.profile.positionOptions.logist' },
]

interface Props {
  // Форма, которой принадлежит поле (результат useForm() родителя).
  // От нее нужен только компонент Field — он связывает селект со стейтом формы.
  form: { Field: unknown }
  // Ключ поля в значениях формы (form.state.values[fieldName]).
  fieldName?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'position',
  disabled: false,
})

const { t } = useI18n()

// Правило валидации (zod). Применяется ниже через :validators.
const positionSchema = z.string().max(100, t('settings.profile.validation.positionMax'))

// Компонент поля той формы, что передали в :form.
// Каст нужен, потому что полный тип Field у TanStack — 20+ дженериков,
// а нам важно лишь одно: это Vue-компонент.
const FormField = props.form.Field as Component

// Опции селекта: текущее значение, которого нет в списке, добавляем,
// чтобы не терять данные при загрузке.
const resolveOptions = (current: string): PositionOption[] => {
  const cur = current?.trim()
  if (cur && !POSITION_OPTIONS.some((o) => o.value === cur)) {
    return [...POSITION_OPTIONS, { value: cur }]
  }
  return [...POSITION_OPTIONS]
}
</script>

<template>
  <!--
    :name — под каким ключом поле живет в форме.
    :validators — правило, которое TanStack прогоняет при каждом вводе (onChange).
    v-slot="{ field }" — API поля: текущее значение (field.state.value),
      ошибки (field.state.meta.errors) и обработчики (handleChange/handleBlur).
  -->
  <FormField :name="props.fieldName" :validators="{ onChange: positionSchema }" v-slot="{ field }">
    <div>
      <select
        :value="field.state.value"
        :disabled="props.disabled"
        class="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        @change="(e: Event) => { field.handleChange((e.target as HTMLSelectElement).value); field.handleBlur() }"
      >
        <option v-for="o in resolveOptions(field.state.value)" :key="o.value" :value="o.value">
          {{ o.labelKey ? t(o.labelKey) : o.value }}
        </option>
      </select>
      <p v-if="field.state.meta.errors.length" class="text-red-500 text-[11px] mt-1">{{ formatFieldErrors(field.state.meta.errors) }}</p>
    </div>
  </FormField>
</template>
