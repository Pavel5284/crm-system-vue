import { getApiErrorMessage } from '~/utils/api'
import { registerApi } from '~/utils/auth.api'
import { isRegisterAutoLogin } from '~/types/backend.contracts'

export interface RegisterPayload {
  email: string
  password: string
  name: string
  captchaToken?: string
}

export const useRegister = () => {
  const router = useRouter()
  const serverError = ref('')
  const successMessage = ref('')

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: (payload: RegisterPayload) =>
      registerApi(payload.email, payload.password, payload.name, payload.captchaToken),
  })

  const register = async (payload: RegisterPayload) => {
    serverError.value = ''
    successMessage.value = ''
    try {
      const res = await mutateAsync(payload)
      // когда верификация выключена бэк сразу ставит куку и можно на логин
      if (isRegisterAutoLogin(res)) {
        await router.push('/login')
        return res
      }
      successMessage.value = res.message ?? ''
      return res
    }
    catch (e) {
      serverError.value = getApiErrorMessage(e)
      throw e
    }
  }

  return { register, isPending, serverError, successMessage }
}
