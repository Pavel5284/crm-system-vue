import { hasTokens } from '~/utils/api'

const PUBLIC_PATHS = ['/login', '/register', '/verify-email']

export default defineNuxtRouteMiddleware((to) => {
    if (!hasTokens() && !PUBLIC_PATHS.includes(to.path)) {
        return navigateTo('/login')
    }
})
