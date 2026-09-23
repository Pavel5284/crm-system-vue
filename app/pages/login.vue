<script setup lang="ts">
import { ApiError, getApiErrorMessage } from '~/utils/api'
import { getMeApi, getProfileApi, loginApi } from '~/utils/auth.api'
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, isValidEmailFormat } from '~/utils/validation'

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

// CAPTCHA показываем после N подряд неудач (бэкенд требует токен,
// когда счетчик failedLoginAttempts достиг порога).
const CAPTCHA_AFTER_FAILURES = 2
const failedAttemptsRef = ref(0)
// Счетчики фронта и сервера могут расходиться (перезагрузка страницы,
// попытки с другого устройства): бэкенд тогда вернет 400 про CAPTCHA
// раньше, чем фронт досчитает до порога, — показываем виджет сразу.
const captchaRequiredRef = ref(false)

const {
  siteKey: turnstileSiteKey,
  tokenRef: turnstileTokenRef,
  containerRef: turnstileContainerRef,
  render: renderTurnstile,
  reset: resetTurnstile,
} = useTurnstile()

const showCaptcha = computed(
  () =>
    turnstileSiteKey !== '' &&
    (failedAttemptsRef.value >= CAPTCHA_AFTER_FAILURES || captchaRequiredRef.value),
)

watch(showCaptcha, async (show) => {
  if (show) {
    await nextTick()
    renderTurnstile()
  }
})

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
      authStore.set({ id: profile.id, email: profile.email, name: profile.name, role: profile.role, status: true, avatarUrl: profile.avatarUrl, position: profile.position, phone: profile.phone, telegram: profile.telegram, isEmailVerified: profile.isEmailVerified })
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
    failedAttemptsRef.value = 0
    captchaRequiredRef.value = false
    emailRef.value = ''
    passwordRef.value = ''
    await router.push('/')
  } catch (e) {
    // Сюда попадают только серверные ошибки (клиентская валидация — в login
    // до authorize): каждая неудача приближает показ CAPTCHA.
    failedAttemptsRef.value += 1
    if (e instanceof ApiError && e.statusCode === 400 && e.message.includes('CAPTCHA')) {
      // Сервер требует капчу (его счетчик обогнал наш) — показать виджет сразу.
      captchaRequiredRef.value = true
      if (!turnstileSiteKey) {
        console.warn('Backend requires Turnstile CAPTCHA, but NUXT_PUBLIC_TURNSTILE_SITE_KEY is not set')
      }
    }
    errorRef.value = getApiErrorMessage(e)
  } finally {
    // Токен Turnstile одноразовый — сбрасываем после каждой попытки.
    resetTurnstile()
    isLoadingStore.set(false)
  }
}

const login = () => {
  errorRef.value = ''
  const email = emailRef.value.trim()
  if (!isValidEmailFormat(email)) {
    errorRef.value = t('login.invalidEmail')
    return
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    errorRef.value = t('login.emailTooLong')
    return
  }
  if (!passwordRef.value) {
    errorRef.value = t('login.passwordRequired')
    return
  }
  if (passwordRef.value.length > PASSWORD_MAX_LENGTH) {
    errorRef.value = t('login.passwordTooLong')
    return
  }
  if (showCaptcha.value && !turnstileTokenRef.value) {
    errorRef.value = t('login.captchaRequired')
    return
  }
  authorize(async () => {
    await loginApi(email, passwordRef.value, turnstileTokenRef.value || undefined)
    await getMeApi()
    const profile = await getProfileApi()
    authStore.set({ id: profile.id, email: profile.email, name: profile.name, role: profile.role, status: true, avatarUrl: profile.avatarUrl, position: profile.position, phone: profile.phone, telegram: profile.telegram, isEmailVerified: profile.isEmailVerified })
  })
}

</script>

<template>
  <div class="flex items-center justify-center min-h-screen w-full">
    <div class="rounded bg-sidebar w-1/4 p-5">
      <div class="flex justify-end mb-2">
        <LayoutLangSwitcher />
      </div>
      <h1 class="text-2xl font-bold text-center mb-5">{{ t('login.title') }}</h1>
      <p v-if="errorRef" class="text-red-500 text-sm text-center mb-3">{{ errorRef }}</p>
      <form @submit.prevent="login" autocomplete="on">
        <UiInput :placeholder="t('login.emailPlaceholder')" type="email" autocomplete="email" name="email" class="mb-3" v-model="emailRef"/>
        <UiInputPassword :placeholder="t('login.passwordPlaceholder')" class="mb-3" v-model="passwordRef" autocomplete="current-password" name="password"/>
        <div v-if="showCaptcha" ref="turnstileContainerRef" class="mb-3 flex justify-center" />
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

