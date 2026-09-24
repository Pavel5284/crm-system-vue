import { getMeApi, getProfileApi } from '~/utils/auth.api'

// Гость уже авторизован (store или httpOnly cookie) — домой.
// Уважает флаг justLoggedOut, чтобы после выхода не редиректило обратно.
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('justLoggedOut')) {
    sessionStorage.removeItem('justLoggedOut')
    return
  }
  const authStore = useAuthStore()
  if (authStore.isAuth) return navigateTo('/')
  try {
    const me = await getMeApi({ retry: false })
    if (!me.authenticated) return
    const profile = await getProfileApi()
    authStore.set({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      status: true,
      avatarUrl: profile.avatarUrl,
      position: profile.position,
      phone: profile.phone,
      telegram: profile.telegram,
      isEmailVerified: profile.isEmailVerified,
    })
    return navigateTo('/')
  }
  catch {
    // гость — остаемся на странице
  }
})
