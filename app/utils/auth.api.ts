import { apiFetch } from '~/utils/api'

export interface AuthTokens {
    accessToken: string
}

export interface AuthUser {
    id: string
    email: string
    name: string
    role: string
    avatarUrl: string | null
    isEmailVerified: boolean
    createdAt: string
}

export interface ProfileData extends AuthUser {
    position: string | null
    phone: string | null
    telegram: string | null
    updatedAt: string
}

export interface Visit {
    id: string
    ip: string
    userAgent: string
    device: string | null
    browser: string | null
    os: string | null
    createdAt: string
}

export const updateProfileApi = (payload: Partial<{ name: string; position: string | null; phone: string | null; telegram: string | null }>) =>
    apiFetch<ProfileData>('/users/updateUserData', { method: 'PATCH', body: payload })

export const updateAvatarApi = (avatarUrl: string) =>
    apiFetch<{ success: boolean }>('/users/profile/avatar', { method: 'POST', body: { avatarUrl } })

export const removeAvatarApi = () =>
    apiFetch<{ success: boolean }>('/users/profile/avatar', { method: 'DELETE' })

export const getProfileApi = () => apiFetch<ProfileData>('/users/profile')

export const getVisitsApi = () => apiFetch<Visit[]>('/users/me/visits')

export const loginApi = async (email: string, password: string) => {
    // бэкенд ставит accessToken+refreshToken в httpOnly cookie, тело ответа — { accessToken } для совместимости
    return apiFetch<AuthTokens>('/auth/login', { method: 'POST', body: { email, password }, auth: false })
}

export const registerApi = async (email: string, password: string, name: string) => {
    return apiFetch<{ message: string }>('/auth/register', {
        method: 'POST',
        body: { email, password, name },
        auth: false,
    })
}

export const verifyEmailApi = async (token: string) => {
    return apiFetch<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, { auth: false })
}

export const resendVerificationApi = async (email: string) => {
    return apiFetch<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        auth: false,
    })
}

export const getMeApi = (opts?: { retry?: boolean }) =>
    apiFetch<{ authenticated: boolean }>('/users/me', { retry: opts?.retry ?? true })

export const logoutApi = async () => {
    await apiFetch<null>('/auth/logout', { method: 'POST', retry: false })
}
