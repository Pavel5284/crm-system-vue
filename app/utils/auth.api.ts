import { apiFetch, clearTokens, setTokens } from '~/utils/api'

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

export interface AuthUser {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
}

export const loginApi = async (email: string, password: string) => {
    const tokens = await apiFetch<AuthTokens>('/auth/login', { method: 'POST', body: { email, password }, auth: false })
    setTokens(tokens)
    return tokens
}

export const registerApi = async (email: string, password: string, name: string) => {
    const tokens = await apiFetch<AuthTokens>('/auth/register', {
        method: 'POST',
        body: { email, password, name },
        auth: false,
    })
    setTokens(tokens)
    return tokens
}

export const getMeApi = () => apiFetch<AuthUser>('/users/me')

export const logoutApi = async () => {
    try {
        await apiFetch<null>('/auth/logout', { method: 'POST' })
    } finally {
        clearTokens()
    }
}
