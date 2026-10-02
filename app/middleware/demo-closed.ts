// Демо-режим (NUXT_PUBLIC_DEMO_MODE=true): регистрация закрыта —
// со страницы /register сразу на вход. Бэкенд при DEMO_MODE=true
// дополнительно режет POST /auth/register и вход не-демо (оборона в глубину).
export default defineNuxtRouteMiddleware(() => {
  const { demoMode } = useRuntimeConfig().public
  if (demoMode) return navigateTo('/login')
})
