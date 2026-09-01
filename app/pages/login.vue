<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, loginApi } from '~/utils/auth.api'

useSeoMeta({
  title: "Login | Kilka CRM",
})

definePageMeta({
  layout: false,
})

const emailRef = ref('')
const passwordRef = ref('')
const errorRef = ref('')

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

const authorize = async (action: () => Promise<void>) => {
  errorRef.value = ''
  isLoadingStore.set(true)
  try {
    await action()
    emailRef.value = ''
    passwordRef.value = ''
    await router.push('/')
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isLoadingStore.set(false)
  }
}

const login = () => authorize(async () => {
  await loginApi(emailRef.value, passwordRef.value)
  const user = await getMeApi()
  authStore.set({ email: user.email, name: user.name, status: true })
})

</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/4 p-5">
      <h1 class="text-2xl font-bold text-center mb-5">Login</h1>
      <p v-if="errorRef" class="text-red-500 text-sm text-center mb-3">{{ errorRef }}</p>
      <form @submit.prevent="login">
        <UiInput placeholder="Email" type="email" class="mb-3" v-model="emailRef"/>
        <UiInput placeholder="Password" type="password" class="mb-3" v-model="passwordRef"/>
        <div class="flex flex-col items-center gap-3">
          <UiButton type="submit">Login</UiButton>
          <NuxtLink to="/register" class="text-sm text-muted-foreground hover:text-white">
            Don't have an account? Register
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>
