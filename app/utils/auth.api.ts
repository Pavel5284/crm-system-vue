import { apiFetch } from '~/utils/api'

export interface AuthTokens {
    accessToken: string
}

export interface AuthUser {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
}

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
    apiFetch<AuthUser>('/users/me', { retry: opts?.retry ?? true })

export const logoutApi = async () => {
    await apiFetch<null>('/auth/logout', { method: 'POST', retry: false })
}
