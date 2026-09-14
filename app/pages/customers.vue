<script lang="ts" setup>
import type { Component } from 'vue'
import MfeCustomersLocal from '~/components/mfe/CustomersLocal.vue'
import MfeCustomersSkeleton from '~/components/mfe/CustomersSkeleton.vue'
import MfeRemoteUnavailable from '~/components/mfe/RemoteUnavailable.vue'
import { loadCustomersRemote } from '~/composables/useCustomersRemote'

// Shell страницы: роутингом владеет host (правило №2), remote отдаёт
// только компонент. Федеративный кусок рендерится строго на клиенте.
const { t, locale } = useI18n()
const config = useRuntimeConfig()

useSeoMeta({
  title: t('customers.seoTitle')
})

type MfeMode = 'local' | 'remote' | 'auto'
const mode = ((config.public.mfeCustomersMode as string | undefined) || 'auto') as MfeMode
const remoteUrl = config.public.mfeCustomersRemoteUrl as string
const apiBaseUrl = config.public.apiBaseUrl as string

const remoteComponent = shallowRef<Component | null>(null)
const failed = ref(false)

async function load(): Promise<void> {
  failed.value = false
  remoteComponent.value = null
  try {
    remoteComponent.value = await loadCustomersRemote(remoteUrl)
  } catch (e) {
    console.error('[mfe] customers remote failed, fallback engaged:', e)
    failed.value = true
  }
}

function retry(): void {
  void load()
}

// local: прежнее поведение с SSR. remote/auto: только клиент (SEO не нужен за логином).
if (mode !== 'local') {
  onMounted(() => { void load() })
}
</script>

<template>
  <!-- Без федерации: 1-в-1 как было, SSR сохранён -->
  <MfeCustomersLocal v-if="mode === 'local'" />

  <ClientOnly v-else>
    <component
      :is="remoteComponent"
      v-if="remoteComponent && !failed"
      :api-base-url="apiBaseUrl"
      :locale="locale"
    />
    <!-- auto: тихий фолбэк на локальную реализацию при падении remote -->
    <MfeCustomersLocal v-else-if="mode === 'auto' && failed" />
    <!-- remote: упавший раздел не роняет CRM — экран деградации с повтором -->
    <MfeRemoteUnavailable v-else-if="failed" @retry="retry" />
    <MfeCustomersSkeleton v-else />
    <template #fallback>
      <MfeCustomersSkeleton />
    </template>
  </ClientOnly>
</template>
