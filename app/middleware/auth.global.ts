const PUBLIC_PATHS = ["/login", "/register", "/verify-email"]

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // если авторизован и идет на публичную страницу -> редирект домой
  if (PUBLIC_PATHS.includes(to.path) && authStore.isAuth) {
    return navigateTo("/")
  }

  // защита приватных роутов делается в layouts/default.vue через getMeApi
  // здесь не делаем async проверку чтобы не дублировать запрос на каждый переход
  // SSR-версию можно расширить до async если нужен серверный редирект
})
