<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: t('settings.seoTitle') })
</script>

<template>
  <div class="max-w-5xl mx-auto p-1">
    <h1 class="text-2xl font-bold mb-6">{{ t('settings.title') }}</h1>
    <div class="space-y-6">
      <SettingsProfileSection />
      <SettingsHistorySection />
    </div>
  </div>
</template>

