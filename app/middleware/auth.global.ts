const PUBLIC_PATHS = ['/login', '/register', '/verify-email']

// httpOnly куки нельзя прочитать из JS (document.cookie / localStorage),
// поэтому синхронная проверка hasTokens() невозможна.
// Защита роутов делается через layouts/default.vue -> getMeApi() с credentials: 'include'.
// Мидлвар оставлен для редиректа уже-залогиненных с публичных страниц и как точка расширения.

export default defineNuxtRouteMiddleware((to) => {
    const authStore = useAuthStore()

    // если уже залогинен — не пускаем на /login и /register
    if (PUBLIC_PATHS.includes(to.path) && authStore.isAuth) {
        return navigateTo('/')
    }

    // для приватных роутов не делаем синхронный редирект по localStorage:
    // кука httpOnly не читается. Проверка произойдёт в layout через /users/me.
    // Если хочешь строгий guard до отрисовки layout — раскомментируй async-проверку:
    // if (!PUBLIC_PATHS.includes(to.path) && !authStore.isAuth) {
    //   try { await getMeApi(); authStore.set(...) } catch { return navigateTo('/login') }
    // }
})
