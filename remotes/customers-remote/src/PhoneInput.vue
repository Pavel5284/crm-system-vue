<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from './lib/cn'
import { handlePhoneKeydown, sanitizePhoneDisplay, truncatePhoneDigits } from './lib/phone'

// Зеркало host `app/components/ui/phone/PhoneInput.vue`.
// Отличие: в remote нет vue-i18n, поэтому placeholder/hint/error
// передаёт родитель (CustomersPage через свой t()).
// Классы — 1-в-1 из host, чтобы выглядело одинаково.
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    autocomplete?: string
    maxlength?: number | string
    error?: string
    hint?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    autocomplete: 'tel',
    maxlength: 25,
    error: '',
    hint: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
}>()

const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', truncatePhoneDigits(sanitizePhoneDisplay(val)))
}

const onKeydown = (e: KeyboardEvent) => {
  handlePhoneKeydown(e)
}

const onBlur = (e: FocusEvent) => {
  emit('blur', e)
}
</script>

<template>
  <div>
    <input
      :value="props.modelValue ?? ''"
      type="tel"
      inputmode="tel"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      :maxlength="props.maxlength"
      :aria-invalid="!!props.error"
      data-slot="input"
      :class="cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        props.class,
      )"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    >
    <p v-if="props.error" class="text-red-500 text-[11px] mt-1">{{ props.error }}</p>
    <p v-else-if="props.hint" class="text-[11px] text-muted-foreground mt-1">{{ props.hint }}</p>
  </div>
</template>
