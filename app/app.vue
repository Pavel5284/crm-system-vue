<script setup lang="ts">
import { setApiToast } from '~/utils/api'

const { locale } = useI18n()

// useToast() внутри дергает inject() — вызывать можно только внутри setup.
// Захватываем инстанс один раз в корне: utils/api дальше берет кеш
// и не вызывает useToast() вне setup (иначе ворнинг на каждый запрос).
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

