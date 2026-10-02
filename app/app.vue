<script setup lang="ts">
import { setApiToast } from '~/utils/api'

const { locale } = useI18n()

// тостер цепляем тут, т.к. вне setup useToast не работает
if (import.meta.client) {
  setApiToast(useToast())
}

useHead({
  htmlAttrs: {
    class: 'dark',
    lang: locale
  }
})
</script>

<template>
  <UApp :toaster="{ position: 'bottom-right' }">
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </UApp>
</template>

