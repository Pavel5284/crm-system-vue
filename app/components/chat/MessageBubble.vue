<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import type { ChatMessage } from '~/types/backend.contracts'

defineProps<{
  message: ChatMessage
  mine: boolean
}>()

const { locale } = useI18n()
</script>

<template>
  <div class="flex" :class="mine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words" :class="mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'">
      <p class="whitespace-pre-wrap break-words">{{ message.text }}</p>
      <p class="text-[10px] mt-1 opacity-70 flex items-center gap-1" :class="mine ? 'justify-end' : 'justify-start'">
        {{ formatDate(message.createdAt, 'full', locale) }}
        <Icon v-if="mine && message.read" name="lucide:check-check" size="14" />
        <Icon v-else-if="mine" name="lucide:check" size="14" />
      </p>
    </div>
  </div>
</template>
