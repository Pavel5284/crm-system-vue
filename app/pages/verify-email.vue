<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { verifyEmailApi } from '~/utils/auth.api'

const { t } = useI18n()
useSeoMeta({ title: t('verifyEmail.seoTitle') })
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const statusRef = ref<'loading' | 'success' | 'error'>('loading')
const messageRef = ref('')

onMounted(async () => {
  const token = String(route.query.token || '')
  if (!token) {
    statusRef.value = 'error'
    messageRef.value = t('verifyEmail.tokenMissing')
    return
  }
  try {
    const res = await verifyEmailApi(token)
    statusRef.value = 'success'
    messageRef.value = res.message
  } catch (e) {
    statusRef.value = 'error'
    messageRef.value = getApiErrorMessage(e)
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/3 p-6 text-center">
      <div class="flex justify-end mb-2">
        <LayoutLangSwitcher />
      </div>
      <h1 class="text-2xl font-bold mb-4">{{ t('verifyEmail.title') }}</h1>
      <p v-if="statusRef === 'loading'" class="text-muted-foreground">{{ t('verifyEmail.loading') }}</p>
      <p v-if="statusRef === 'success'" class="text-green-500 mb-4">{{ messageRef }}</p>
      <p v-if="statusRef === 'error'" class="text-red-500 mb-4">{{ messageRef }}</p>
      <UiButton v-if="statusRef === 'success'" @click="router.push('/login')">{{ t('verifyEmail.goToLogin') }}</UiButton>
      <NuxtLink v-if="statusRef === 'error'" to="/register" class="text-sm text-muted-foreground hover:text-white">{{ t('verifyEmail.goToRegister') }}</NuxtLink>
    </div>
  </div>
</template>

