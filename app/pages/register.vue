<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, registerApi, resendVerificationApi } from '~/utils/auth.api'

useSeoMeta({
  title: "Register | Kilka CRM",
})

definePageMeta({
  layout: false,
})

const emailRef = ref('')
const passwordRef = ref('')
const nameRef = ref('')
const errorRef = ref('')
const successRef = ref('')

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  try {
    const user = await getMeApi({ retry: false })
    if (user) {
      authStore.set({ email: user.email, name: user.name, status: true })
      await router.push('/')
    }
  } catch (e) {
  }
})

const register = async () => {
  errorRef.value = ''
  successRef.value = ''
  isLoadingStore.set(true)
  try {
    const res = await registerApi(emailRef.value, passwordRef.value, nameRef.value)
    successRef.value = res.message
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isLoadingStore.set(false)
  }
}

const resend = async () => {
  if (!emailRef.value) {
    errorRef.value = 'Укажите email'
    return
  }
  errorRef.value = ''
  successRef.value = ''
  try {
    const res = await resendVerificationApi(emailRef.value)
    successRef.value = res.message
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/4 p-5">
      <h1 class="text-2xl font-bold text-center mb-5">Register</h1>
      <p v-if="errorRef" class="text-red-500 text-sm text-center mb-3">{{ errorRef }}</p>
      <p v-if="successRef" class="text-green-500 text-sm text-center mb-3">{{ successRef }}</p>
      <form v-if="!successRef" @submit.prevent="register">
        <UiInput placeholder="Name" type="text" class="mb-3" v-model="nameRef" />
        <UiInput placeholder="Email" type="email" class="mb-3" v-model="emailRef" />
        <UiInput placeholder="Password" type="password" class="mb-3" v-model="passwordRef" />
        <div class="flex flex-col items-center gap-3">
          <UiButton type="submit">Register</UiButton>
          <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
            Already have an account? Login
          </NuxtLink>
        </div>
      </form>
      <div v-else class="flex flex-col items-center gap-3">
        <p class="text-sm text-center text-muted-foreground">Не пришло письмо?</p>
        <UiButton type="button" variant="outline" @click="resend">Отправить повторно</UiButton>
        <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
          Перейти к входу
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
