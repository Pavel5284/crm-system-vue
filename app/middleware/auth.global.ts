import { hasTokens } from '~/utils/api'

export default defineNuxtRouteMiddleware((to) => {
    if (!hasTokens() && to.path !== '/login') {
        return navigateTo('/login')
    }
})
