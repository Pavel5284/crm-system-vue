import { getApiErrorMessage } from '~/utils/api'
import { getMeApi, getProfileApi, loginApi } from '~/utils/auth.api'

export interface LoginPayload {
  email: string
  password: string
}

// Вход через TanStack Query: локальный isPending вместо глобального
// useIsLoadingStore, серверная ошибка в serverError, успех — редирект домой.
export const useLogin = () => {
  const router = useRouter()
  const authStore = useAuthStore()
  const serverError = ref('')

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (payload: LoginPayload) => loginApi(payload.email, payload.password),
  })

  const login = async (payload: LoginPayload) => {
    serverError.value = ''
    try {
      await mutateAsync(payload)
      await getMeApi()
      const profile = await getProfileApi()
      authStore.set({ id: profile.id, email: profile.email, name: profile.name, role: profile.role, status: true, avatarUrl: profile.avatarUrl, position: profile.position, phone: profile.phone, telegram: profile.telegram, isEmailVerified: profile.isEmailVerified })
      await router.push('/')
    }
    catch (e) {
      serverError.value = getApiErrorMessage(e)
      throw e
    }
  }

  return { login, isPending, serverError }
}
