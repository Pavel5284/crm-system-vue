<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  placeholder?: string
  class?: HTMLAttributes["class"]
  autocomplete?: string
  disabled?: boolean
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const show = ref(false)
</script>

<template>
  <div :class="cn('relative', props.class)">
    <input
      v-model="modelValue"
      :type="show ? 'text' : 'password'"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :disabled="props.disabled"
      data-slot="input"
      :class="cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      )"
    >
    <button
      type="button"
      tabindex="-1"
      :aria-label="show ? 'Скрыть пароль' : 'Показать пароль'"
      class="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      @click="show = !show"
    >
      <Icon :name="show ? 'lucide:eye-off' : 'lucide:eye'" size="18" />
    </button>
  </div>
</template>

<style scoped>
/* убираем нативный глаз Edge/IE и WebKit/Chromium */
input::-ms-reveal,
input::-ms-clear {
  display: none;
}
input::-webkit-credentials-auto-fill-button,
input::-webkit-contacts-auto-fill-button {
  visibility: hidden;
  display: none !important;
  pointer-events: none;
  position: absolute;
  right: 0;
}
</style>
