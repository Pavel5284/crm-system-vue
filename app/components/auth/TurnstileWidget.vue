<script setup lang="ts">
// виджет невидимый, токен просим только после валидной формы
const { siteKey, containerRef, render, execute, reset } = useTurnstile()

defineExpose({ execute, reset })

onMounted(() => {
  if (siteKey) render({ size: 'invisible' })
})
</script>

<template>
  <div v-if="siteKey" ref="containerRef" class="hidden" aria-hidden="true" />
</template>
