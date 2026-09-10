<script setup lang="ts">
defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()

const { t } = useI18n()
const handleError = () => clearError({ redirect: "/" })
</script>

<template>
  <div class="min-h-screen grid place-items-center p-6 bg-background">
    <div class="max-w-md w-full text-center rounded-lg border border-border bg-card p-8">
      <p class="text-6xl font-bold text-primary mb-2">{{ error.statusCode || 500 }}</p>
      <h1 class="text-xl font-semibold mb-2">
        {{ error.statusCode === 404 ? t("common.pageNotFound") : t("common.internalError") }}
      </h1>
      <p class="text-sm text-muted-foreground mb-6">
        {{ error.statusMessage || error.message || t("common.error") }}
      </p>
      <div class="flex gap-3 justify-center">
        <UiButton @click="handleError">{{ t("common.backToHome") }}</UiButton>
        <UiButton variant="outline" @click="() => $router.go(-1)">{{ t("common.tryAgain") }}</UiButton>
      </div>
    </div>
  </div>
</template>
