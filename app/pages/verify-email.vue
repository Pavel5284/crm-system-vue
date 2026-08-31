<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { verifyEmailApi } from '~/utils/auth.api'

useSeoMeta({ title: 'Verify Email | Kilka CRM' })
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const statusRef = ref<'loading' | 'success' | 'error'>('loading')
const messageRef = ref('')

onMounted(async () => {
  const token = String(route.query.token || '')
  if (!token) {
    statusRef.value = 'error'
    messageRef.value = 'Токен не указан'
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
      <h1 class="text-2xl font-bold mb-4">Подтверждение email</h1>
      <p v-if="statusRef === 'loading'" class="text-muted-foreground">Проверяем токен...</p>
      <p v-if="statusRef === 'success'" class="text-green-500 mb-4">{{ messageRef }}</p>
      <p v-if="statusRef === 'error'" class="text-red-500 mb-4">{{ messageRef }}</p>
      <UiButton v-if="statusRef === 'success'" @click="router.push('/login')">Перейти к входу</UiButton>
      <NuxtLink v-if="statusRef === 'error'" to="/register" class="text-sm text-muted-foreground hover:text-white">Вернуться к регистрации</NuxtLink>
    </div>
  </div>
</template>
