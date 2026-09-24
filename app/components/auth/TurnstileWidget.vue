<script setup lang="ts">
// Невидимый Turnstile: рендерится скрытым при монтировании, челлендж
// запускается только через execute() (после валидной формы) и отдает
// Promise с одноразовым токеном. reset — после каждой попытки регистрации.
const { siteKey, containerRef, render, execute, reset } = useTurnstile()

defineExpose({ execute, reset })

onMounted(() => {
  if (siteKey) render({ size: 'invisible' })
})
</script>

<template>
  <div v-if="siteKey" ref="containerRef" class="hidden" aria-hidden="true" />
</template>
