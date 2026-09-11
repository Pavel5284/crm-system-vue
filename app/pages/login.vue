<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, getProfileApi, loginApi } from '~/utils/auth.api'

const { t } = useI18n()

useSeoMeta({
  title: t('login.seoTitle'),
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
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('justLoggedOut')) {
    sessionStorage.removeItem('justLoggedOut')
    return
  }
  if (authStore.isAuth) {
    await router.push('/')
    return
  }
  try {
    const me = await getMeApi({ retry: false })
    if (me.authenticated) {
      const profile = await getProfileApi()
      authStore.set({ id: profile.id, email: profile.email, name: profile.name, status: true, avatarUrl: profile.avatarUrl, position: profile.position, phone: profile.phone, telegram: profile.telegram, isEmailVerified: profile.isEmailVerified })
      await router.push('/')
    }
  } catch (_e) {
    void _e
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
  await getMeApi()
  const profile = await getProfileApi()
  authStore.set({ id: profile.id, email: profile.email, name: profile.name, status: true, avatarUrl: profile.avatarUrl, position: profile.position, phone: profile.phone, telegram: profile.telegram, isEmailVerified: profile.isEmailVerified })
})

</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/4 p-5">
      <div class="flex justify-end mb-2">
        <LayoutLangSwitcher />
      </div>
      <h1 class="text-2xl font-bold text-center mb-5">{{ t('login.title') }}</h1>
      <form @submit.prevent="login" autocomplete="on">
        <UiInput :placeholder="t('login.emailPlaceholder')" type="email" autocomplete="email" name="email" class="mb-3" v-model="emailRef"/>
        <UiInputPassword :placeholder="t('login.passwordPlaceholder')" class="mb-3" v-model="passwordRef" autocomplete="current-password" name="password"/>
        <div class="flex flex-col items-center gap-3">
          <UiButton type="submit">{{ t('login.loginButton') }}</UiButton>
          <NuxtLink to="/register" class="text-sm text-muted-foreground hover:text-white">
            {{ t('login.noAccount') }}
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

