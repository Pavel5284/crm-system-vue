<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="font-bold text-2x1 mb-10">{{ t('customers.listTitle') }}</h1>
    <div class="grid gap-3" aria-busy="true">
      <UiSkeleton v-for="i in 6" :key="i" class="h-14 w-full rounded-xl" />
    </div>
  </div>
</template>
