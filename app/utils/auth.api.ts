import { apiFetch } from '~/utils/api'
import type {
  AuthTokens,
  AuthUser,
  AvatarError,
  LoginError,
  LoginResponse,
  LogoutError,
  MeError,
  MeResponse,
  NoContent,
  ProfileData,
  ProfileError,
  RefreshError,
  RefreshResponse,
  RegisterError,
  RegisterResponse,
  ResendVerificationError,
  ResendVerificationResponse,
  SuccessResponse,
  UpdateProfileError,
  UpdateProfilePayload,
  VerifyEmailError,
  VerifyEmailResponse,
  Visit,
  VisitsError,
  VisitsPaginated,
  VisitsQuery,
} from '~/types/backend.contracts'

export type {
  AuthTokens,
  AuthUser,
  ProfileData,
  Visit,
  VisitsPaginated,
  UpdateProfilePayload,
  MeResponse,
  RegisterResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
}

export const updateProfileApi = (payload: UpdateProfilePayload) =>
  apiFetch<ProfileData, UpdateProfileError>('/users/updateUserData', { method: 'PATCH', body: payload })

export const updateAvatarApi = (avatarUrl: string) =>
  apiFetch<SuccessResponse, AvatarError>('/users/profile/avatar', { method: 'POST', body: { avatarUrl } })

export const removeAvatarApi = () =>
  apiFetch<SuccessResponse, AvatarError>('/users/profile/avatar', { method: 'DELETE' })

export const getProfileApi = () => apiFetch<ProfileData, ProfileError>('/users/profile')

export const getVisitsApi = (params?: VisitsQuery) => {
  const query: Record<string, string | number | boolean | undefined> = {}
  if (params?.page !== undefined) query.page = params.page
  if (params?.limit !== undefined) query.limit = params.limit
  return apiFetch<VisitsPaginated, VisitsError>('/users/me/visits', { query })
}

export const loginApi = async (email: string, password: string, captchaToken?: string) => {
  // бэкенд ставит accessToken+refreshToken в httpOnly cookie, тело ответа — { accessToken } для совместимости
  return apiFetch<LoginResponse, LoginError>('/auth/login', { method: 'POST', body: { email, password, captchaToken }, auth: false })
}

export const registerApi = async (email: string, password: string, name: string, captchaToken?: string) => {
  return apiFetch<RegisterResponse, RegisterError>('/auth/register', {
    method: 'POST',
    body: { email, password, name, captchaToken },
    auth: false,
  })
}

export const verifyEmailApi = async (token: string) => {
  return apiFetch<VerifyEmailResponse, VerifyEmailError>(`/auth/verify-email?token=${encodeURIComponent(token)}`, { auth: false })
}

export const resendVerificationApi = async (email: string) => {
  return apiFetch<ResendVerificationResponse, ResendVerificationError>('/auth/resend-verification', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}

export const getMeApi = (opts?: { retry?: boolean }) =>
  apiFetch<MeResponse, MeError>('/users/me', { retry: opts?.retry ?? true })

export const refreshApi = () =>
  apiFetch<RefreshResponse, RefreshError>('/auth/refresh', { method: 'POST', auth: false, retry: false })

export const logoutApi = async (): Promise<void> => {
  await apiFetch<NoContent, LogoutError>('/auth/logout', { method: 'POST', retry: false })
}
