<script setup lang="ts">
import { getMeApi, getProfileApi } from '~/utils/auth.api'

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const router = useRouter()

const checkAuth = async () => {
  // уже залогинены из login.vue:50 — не дублируем GET /users/me
  if (authStore.isAuth) {
    isLoadingStore.set(false)
    return
  }
  try{
    // me — только проверка авторизации {authenticated}, данные — из /profile
    const me = await getMeApi()
    if (!me.authenticated) throw new Error('Not authenticated')
    const profile = await getProfileApi()
    authStore.set({
      email: profile.email,
      name: profile.name,
      status: true,
      avatarUrl: profile.avatarUrl,
      position: profile.position,
      phone: profile.phone,
      telegram: profile.telegram,
      isEmailVerified: profile.isEmailVerified,
    })
  } catch (error) {
    authStore.clear()
    await router.push('/login')
  } finally {
    isLoadingStore.set(false)
  }
}

onNuxtReady(async () => {
  await checkAuth()
})

const isAuth = computed(() => authStore.isAuth)

</script>


<template>
  <UApp>
    <div v-if="isLoadingStore.isLoading" class="fixed inset-0 grid place-items-center bg-background z-50">
      <LayoutLoader />
    </div>
    <section :class="{grid: isAuth}" style="min-height: 100vh">
      <LayoutSidebar v-if="isAuth"/>
      <div :class="isAuth ? 'flex flex-col min-h-screen min-w-0' : ''">
        <LayoutHeader v-if="isAuth" />
        <div :style="isAuth ? 'padding:20px' : ''" class="flex-1 min-w-0">
          <slot />
        </div>
      </div>
    </section>
  </UApp>
</template>

<style scoped>
.grid{
  display: grid;
  grid-template-columns: 240px 1fr;

}
</style>