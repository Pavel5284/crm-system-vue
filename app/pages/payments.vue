<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: t("menu.payments") })
</script>

<template>
  <div class="max-w-2xl mx-auto py-16 text-center">
    <Icon name="lucide:construction" size="48" class="mx-auto text-muted-foreground mb-4" />
    <h1 class="text-2xl font-bold mb-2">{{ t("common.soon") }}</h1>
    <p class="text-muted-foreground mb-6">{{ t("common.soonDescription") }}</p>
    <UiButton @click="navigateTo('/')">{{ t("common.backToHome") }}</UiButton>
  </div>
</template>
