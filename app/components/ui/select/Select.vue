<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineProps<{
  options: string[]
  title?: string
  allLabel: string
}>()
</script>

<template>
  <select
    v-model="modelValue"
    class="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    :title="title"
  >
    <option value="">{{ allLabel }}</option>
    <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
  </select>
</template>
