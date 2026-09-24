<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('login.seoTitle'),
})

definePageMeta({
  layout: false,
  middleware: ['guest'],
})
</script>

<template>
  <AuthCard>
    <template #title>{{ t('login.title') }}</template>
    <AuthLoginForm />
  </AuthCard>
</template>
