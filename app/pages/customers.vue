<script lang="ts" setup>
import type { Component } from 'vue'
import MfeCustomersLocal from '~/components/mfe/CustomersLocal.vue'
import MfeCustomersSkeleton from '~/components/mfe/CustomersSkeleton.vue'
import MfeRemoteUnavailable from '~/components/mfe/RemoteUnavailable.vue'
import { loadCustomersRemote } from '~/composables/useCustomersRemote'

// шелл страницы, роутингом владеет хост, remote отдает только компонент
const { t, locale } = useI18n()
const config = useRuntimeConfig()

useSeoMeta({
  title: t('customers.seoTitle')
})

type MfeMode = 'local' | 'remote' | 'auto'
const mode = ((config.public.mfeCustomersMode as string | undefined) || 'auto') as MfeMode
const remoteUrl = config.public.mfeCustomersRemoteUrl as string
// тот же base что и у хоста, иначе remote уйдет на относительный url
// и получит html страницы вместо json
const apiBaseUrl = useApiBaseUrl()

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

// local с ssr, remote/auto только на клиенте
if (mode !== 'local') {
  onMounted(() => { void load() })
}
</script>

<template>
  <MfeCustomersLocal v-if="mode === 'local'" />

  <ClientOnly v-else>
    <component
      :is="remoteComponent"
      v-if="remoteComponent && !failed"
      :api-base-url="apiBaseUrl"
      :locale="locale"
    />
    <MfeCustomersLocal v-else-if="mode === 'auto' && failed" />
    <MfeRemoteUnavailable v-else-if="failed" @retry="retry" />
    <MfeCustomersSkeleton v-else />
    <template #fallback>
      <MfeCustomersSkeleton />
    </template>
  </ClientOnly>
</template>
