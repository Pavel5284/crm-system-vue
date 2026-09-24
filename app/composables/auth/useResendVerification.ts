import { useIntervalFn } from '@vueuse/core'
import { getApiErrorMessage } from '~/utils/api'
import { resendVerificationApi } from '~/utils/auth.api'

export const RESEND_COOLDOWN_SEC = 60

// Повторная отправка письма + кулдаун через useIntervalFn (автоочистка на unmount).
export const useResendVerification = () => {
  const serverError = ref('')
  const cooldown = ref(0)

  const { pause, resume } = useIntervalFn(
    () => {
      cooldown.value -= 1
      if (cooldown.value <= 0) {
        cooldown.value = 0
        pause()
      }
    },
    1000,
    { immediate: false },
  )

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['auth', 'resend-verification'],
    mutationFn: (email: string) => resendVerificationApi(email.trim()),
  })

  const resend = async (email: string) => {
    if (cooldown.value > 0 || !email.trim()) return null
    serverError.value = ''
    try {
      const res = await mutateAsync(email)
      cooldown.value = RESEND_COOLDOWN_SEC
      resume()
      return res
    }
    catch (e) {
      serverError.value = getApiErrorMessage(e)
      throw e
    }
  }

  onUnmounted(() => pause())

  return { resend, isPending, cooldown, serverError }
}
