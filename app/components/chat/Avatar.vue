<script setup lang="ts">
import { displayName, getInitials } from '~/utils/chat-display'

const props = withDefaults(
  defineProps<{
    name: string
    email: string
    avatarUrl?: string | null
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)

const boxClass = computed(() =>
  props.size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs',
)
</script>

<template>
  <img
    v-if="avatarUrl"
    :src="avatarUrl"
    :alt="displayName({ name, email })"
    class="rounded-full object-cover border border-border shrink-0"
    :class="boxClass"
  />
  <span
    v-else
    class="rounded-full bg-primary text-primary-foreground grid place-items-center font-bold border border-border shrink-0"
    :class="boxClass"
  >
    {{ getInitials(displayName({ name, email }), email) }}
  </span>
</template>
