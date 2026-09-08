<script setup lang="ts">
const { locale } = useI18n()
useHead({
  htmlAttrs: {
    class: 'dark',
    lang: locale
  }
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </UApp>
</template>

