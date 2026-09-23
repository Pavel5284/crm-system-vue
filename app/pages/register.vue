<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, getProfileApi, registerApi, resendVerificationApi } from '~/utils/auth.api'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isValidEmailFormat } from '~/utils/validation'
import { isRegisterAutoLogin } from '~/types/backend.contracts'

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
const resendCooldownRef = ref(0)
const turnstileTokenRef = ref('')
const turnstileContainerRef = ref<HTMLDivElement | null>(null)

interface TurnstileWidgetApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidgetApi
  }
}

const turnstileSiteKey = (useRuntimeConfig().public.turnstileSiteKey || '') as string

useHead({
  script: turnstileSiteKey
    ? [
        {
          src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
          async: true,
          defer: true,
        },
      ]
    : [],
})

let resendTimer: ReturnType<typeof setInterval> | null = null
let turnstilePoll: ReturnType<typeof setInterval> | null = null
let turnstileWidgetId: string | null = null

const resetTurnstile = () => {
  turnstileTokenRef.value = ''
  if (turnstileWidgetId && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId)
  }
}

onUnmounted(() => {
  if (resendTimer) clearInterval(resendTimer)
  if (turnstilePoll) clearInterval(turnstilePoll)
  if (turnstileWidgetId && window.turnstile) {
    window.turnstile.remove(turnstileWidgetId)
    turnstileWidgetId = null
  }
})

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()
const router = useRouter()

const passwordsMismatch = computed(() => {
  return confirmPasswordRef.value.length > 0 && passwordRef.value !== confirmPasswordRef.value
})

onMounted(async () => {
  if (turnstileSiteKey) renderTurnstileWidget()
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

// Виджет грузится асинхронно с CDN — ждем window.turnstile поллингом.
const renderTurnstileWidget = () => {
  let attempts = 0
  const tryRender = () => {
    const api = window.turnstile
    const el = turnstileContainerRef.value
    if (api && el && !turnstileWidgetId) {
      turnstileWidgetId = api.render(el, {
        sitekey: turnstileSiteKey,
        callback: (token: string) => {
          turnstileTokenRef.value = token
        },
        'expired-callback': () => {
          turnstileTokenRef.value = ''
        },
        'error-callback': () => {
          turnstileTokenRef.value = ''
        },
      })
      return true
    }
    return false
  }
  if (!tryRender()) {
    turnstilePoll = setInterval(() => {
      attempts += 1
      if (tryRender() || attempts > 50) {
        if (turnstilePoll) clearInterval(turnstilePoll)
        turnstilePoll = null
      }
    }, 200)
  }
}

const register = async () => {
  errorRef.value = ''
  successRef.value = ''

  const name = nameRef.value.trim()
  const email = emailRef.value.trim()

  if (!name) {
    errorRef.value = t('register.nameRequired')
    return
  }
  if (name.length > NAME_MAX_LENGTH) {
    errorRef.value = t('register.nameTooLong')
    return
  }
  if (!isValidEmailFormat(email)) {
    errorRef.value = t('register.invalidEmail')
    return
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    errorRef.value = t('register.emailTooLong')
    return
  }
  if (!passwordRef.value || passwordRef.value.length < PASSWORD_MIN_LENGTH) {
    errorRef.value = t('register.passwordTooShort')
    return
  }
  if (passwordRef.value.length > PASSWORD_MAX_LENGTH) {
    errorRef.value = t('register.passwordTooLong')
    return
  }
  if (passwordRef.value !== confirmPasswordRef.value) {
    errorRef.value = t('register.passwordsMismatch')
    return
  }
  if (turnstileSiteKey && !turnstileTokenRef.value) {
    errorRef.value = t('register.captchaRequired')
    return
  }

  isLoadingStore.set(true)
  try {
    const res = await registerApi(
      email,
      passwordRef.value,
      name,
      turnstileTokenRef.value || undefined,
    )
    // если SKIP_EMAIL_VERIFICATION=true бэк отдает { accessToken } и ставит httpOnly куки - редиректим на login
    if (isRegisterAutoLogin(res)) {
      await router.push('/login')
      return
    }
    successRef.value = res.message ?? ''
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    // Токен одноразовый — сбрасываем виджет после каждой попытки.
    resetTurnstile()
    isLoadingStore.set(false)
  }
}

const RESEND_COOLDOWN_SEC = 60

const startResendCooldown = () => {
  resendCooldownRef.value = RESEND_COOLDOWN_SEC
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldownRef.value -= 1
    if (resendCooldownRef.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

const resend = async () => {
  if (!emailRef.value.trim()) {
    errorRef.value = t('register.enterEmail')
    return
  }
  if (resendCooldownRef.value > 0) return
  errorRef.value = ''
  successRef.value = ''
  try {
    const res = await resendVerificationApi(emailRef.value.trim())
    successRef.value = res.message
    startResendCooldown()
  } catch (e) {
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
        <div v-if="turnstileSiteKey" ref="turnstileContainerRef" class="mb-3 flex justify-center" />
        <div class="flex flex-col items-center gap-3">
          <UiButton type="submit" :disabled="passwordsMismatch">{{ t('register.registerButton') }}</UiButton>
          <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
            {{ t('register.haveAccount') }}
          </NuxtLink>
        </div>
      </form>
      <div v-else class="flex flex-col items-center gap-3">
        <p class="text-sm text-center text-muted-foreground">{{ t('register.resendQuestion') }}</p>
        <UiButton type="button" variant="outline" :disabled="resendCooldownRef > 0" @click="resend">
          {{ resendCooldownRef > 0 ? t('register.resendCooldown', { s: resendCooldownRef }) : t('register.resendButton') }}
        </UiButton>
        <NuxtLink to="/login" class="text-sm text-muted-foreground hover:text-white">
          {{ t('register.goToLogin') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

