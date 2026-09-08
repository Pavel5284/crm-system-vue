<script setup lang="ts">
const { locale, setLocale, locales } = useI18n()
const availableLocales = computed(() => (locales.value as Array<{code: string, name: string}>))
const current = computed(() => locale.value)
const switchLocale = async (code: string) => {
  await setLocale(code)
}
</script>
<template>
  <div class="flex items-center gap-1 rounded-full border border-border p-1 bg-muted/30">
    <button v-for="loc in availableLocales" :key="loc.code" type="button" class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors" :class="current === loc.code ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-accent text-muted-foreground'" @click="switchLocale(loc.code)">{{ loc.code.toUpperCase() }}</button>
  </div>
</template>

