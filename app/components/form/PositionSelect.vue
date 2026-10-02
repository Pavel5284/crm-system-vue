<!-- селект должности -->
<script setup lang="ts">
import type { Component } from 'vue'
import { z } from 'zod'
import { formatFieldErrors } from '~/utils/form-errors'

interface PositionOption {
  value: string
  labelKey?: string
}

// то что реально лежит в базе, labelKey для показа
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
  form: { Field: unknown }
  fieldName?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'position',
  disabled: false,
})

const { t } = useI18n()

const positionSchema = z.string().max(100, t('settings.profile.validation.positionMax'))

const FormField = props.form.Field as Component

// если в базе лежит что-то старое чего нет в списке - показываем как есть чтобы не потерять
const resolveOptions = (current: string): PositionOption[] => {
  const cur = current?.trim()
  if (cur && !POSITION_OPTIONS.some((o) => o.value === cur)) {
    return [...POSITION_OPTIONS, { value: cur }]
  }
  return [...POSITION_OPTIONS]
}
</script>

<template>
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
