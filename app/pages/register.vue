<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('register.seoTitle'),
})

definePageMeta({
  layout: false,
  middleware: ['guest'],
})
</script>

<template>
  <AuthCard>
    <template #title>{{ t('register.title') }}</template>
    <AuthRegisterForm />
  </AuthCard>
</template>
