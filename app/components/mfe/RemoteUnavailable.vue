<script setup lang="ts">
// Экран деградации (вариант B): раздел-remote упал —
// остальной CRM обязан продолжать работать.
const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="max-w-2xl mx-auto py-16 text-center">
    <Icon name="lucide:cloud-off" size="48" class="mx-auto text-muted-foreground mb-4" />
    <h1 class="text-2xl font-bold mb-2">{{ t('mfe.unavailableTitle') }}</h1>
    <p class="text-muted-foreground mb-6">{{ t('mfe.unavailableDescription') }}</p>
    <div class="flex items-center justify-center gap-3">
      <UiButton @click="emit('retry')">{{ t('mfe.retry') }}</UiButton>
      <UiButton variant="outline" @click="navigateTo('/')">{{ t('common.backToHome') }}</UiButton>
    </div>
  </div>
</template>
