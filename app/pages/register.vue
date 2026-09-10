<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, getProfileApi, registerApi, resendVerificationApi } from '~/utils/auth.api'

const { t } = useI18n()

useSeoMeta({
  title: t('register.seoTitle'),
})

definePageMeta({
  layout: false,
})

const emailRef = ref('')
const passwordRef = ref('')
const confirmPasswordRef = ref('')
const nameRef = ref('')
const errorRef = ref('')
const successRef = ref('')

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()
const router = useRouter()

const passwordsMismatch = computed(() => {
  return confirmPasswordRef.value.length > 0 && passwordRef.value !== confirmPasswordRef.value
})

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

const register = async () => {
  errorRef.value = ''
  successRef.value = ''

  if (!passwordRef.value || passwordRef.value.length < 8) {
    errorRef.value = t('register.passwordTooShort')
    return
  }
  if (passwordRef.value !== confirmPasswordRef.value) {
    errorRef.value = t('register.passwordsMismatch')
    return
  }

  isLoadingStore.set(true)
  try {
    const res = await registerApi(emailRef.value, passwordRef.value, nameRef.value) as { message?: string; accessToken?: string }
    // если SKIP_EMAIL_VERIFICATION=true бэк отдает { accessToken } и ставит httpOnly куки - редиректим на login
    if (res.accessToken) {
      await router.push('/login')
      return
    }
    successRef.value = res.message ?? ''
  } catch (_e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isLoadingStore.set(false)
  }
}

const resend = async () => {
  if (!emailRef.value) {
    errorRef.value = t('register.enterEmail')
    return
  }
  errorRef.value = ''
  successRef.value = ''
  try {
    const res = await resendVerificationApi(emailRef.value)
    successRef.value = res.message
  } catch (_e) {
    errorRef.value = getApiErrorMessage(e)
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/4 p-5">
      <div class="flex justify-end mb-2">
        <LayoutLangSwitcher />
      </div>
      <h1 class="text-2xl font-bold text-center mb-5">{{ t('register.title') }}</h1>
      <p v-if="errorRef" class="text-red-500 text-sm text-center mb-3">{{ errorRef }}</p>
      <p v-if="successRef" class="text-green-500 text-sm text-center mb-3">{{ successRef }}</p>
      <form v-if="!successRef" @submit.prevent="register" autocomplete="on">
        <UiInput :placeholder="t('register.namePlaceholder')" type="text" autocomplete="name" name="name" class="mb-3" v-model="nameRef" />
        <UiInput :placeholder="t('register.emailPlaceholder')" type="email" autocomplete="email" name="email" class="mb-3" v-model="emailRef" />
        <UiInputPassword :placeholder="t('register.passwordPlaceholder')" class="mb-3" v-model="passwordRef" autocomplete="new-password" name="new-password" />
        <UiInputPassword :placeholder="t('register.confirmPasswordPlaceholder')" class="mb-1" v-model="confirmPasswordRef" autocomplete="new-password" name="confirm-password" />
        <p v-if="passwordsMismatch" class="text-red-500 text-xs mb-3">{{ t('register.passwordsMismatch') }}</p>
        <div v-else class="mb-3" />
        <div class="flex flex-col items-center gap-3">
          <UiButton type="submit" :disabled="passwordsMismatch">{{ t('register.registerButton') }}</UiButton>
          <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
            {{ t('register.haveAccount') }}
          </NuxtLink>
        </div>
      </form>
      <div v-else class="flex flex-col items-center gap-3">
        <p class="text-sm text-center text-muted-foreground">{{ t('register.resendQuestion') }}</p>
        <UiButton type="button" variant="outline" @click="resend">{{ t('register.resendButton') }}</UiButton>
        <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
          {{ t('register.goToLogin') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

