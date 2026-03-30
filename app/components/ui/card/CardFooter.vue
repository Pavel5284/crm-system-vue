<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card-footer"
    :class="cn('pt-0 text-xs opacity-70 italic', props.class)"
  >
    <slot />
  </div>
</template>
