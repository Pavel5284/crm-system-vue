<script setup lang="ts">

useSeoMeta({ title: 'Settings | CRM System' })
</script>

<template>
  <div class="max-w-5xl mx-auto p-1">
    <h1 class="text-2xl font-bold mb-6">Настройки</h1>
    <div class="space-y-6">
      <SettingsProfileSection />
      <SettingsHistorySection />
    </div>
  </div>
</template>
