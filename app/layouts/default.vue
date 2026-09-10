<script setup lang="ts">
import { getMeApi, getProfileApi } from "~/utils/auth.api"

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const checkAuth = async (): Promise<void> => {
  if (authStore.isAuth) {
    isLoadingStore.set(false)
    return
  }
  try {
    const me = await getMeApi()
    if (!me.authenticated) throw new Error("Not authenticated")
    const profile = await getProfileApi()
    authStore.set({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      status: true,
      avatarUrl: profile.avatarUrl,
      position: profile.position,
      phone: profile.phone,
      telegram: profile.telegram,
      isEmailVerified: profile.isEmailVerified,
    })
  } catch {
    authStore.clear()
    await navigateTo("/login")
  } finally {
    isLoadingStore.set(false)
  }
}

onNuxtReady(async () => {
  await checkAuth()
})

const isAuth = computed(() => authStore.isAuth)
const showMobileMenu = ref(false)

const chatStore = useChatStore()
useChatSocket()

watch(isAuth, async (v) => {
  if (v) await chatStore.fetchUnreadCount()
})

watch(showMobileMenu, (v) => {
  if (import.meta.client) {
    document.body.style.overflow = v ? "hidden" : ""
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ""
})
</script>

<template>
  <div v-if="isLoadingStore.isLoading" class="fixed inset-0 grid place-items-center bg-background z-50">
    <LayoutLoader />
  </div>
  <section :class="isAuth ? 'grid' : ''" style="min-height: 100vh">
    <LayoutSidebar v-if="isAuth" class="hidden lg:flex" />
    <div v-if="isAuth && showMobileMenu" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showMobileMenu = false" />
      <div class="relative w-[280px] max-w-[85vw] h-full overflow-auto bg-gray-800 shadow-xl">
        <LayoutSidebar />
        <button class="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-md text-white/70 hover:text-white hover:bg-white/10" aria-label="Close menu" @click="showMobileMenu = false">
          <Icon name="lucide:x" size="20" />
        </button>
      </div>
    </div>
    <div :class="isAuth ? 'flex flex-col min-h-0 min-w-0' : ''">
      <LayoutHeader v-if="isAuth" @toggle-menu="showMobileMenu = !showMobileMenu" />
      <div :style="isAuth ? 'padding:20px' : ''" class="flex-1 min-w-0">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 240px 1fr;
}
@media (max-width: 1024px) {
  .grid {
    display: block;
  }
}
</style>
