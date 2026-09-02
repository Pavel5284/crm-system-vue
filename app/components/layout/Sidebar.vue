<script lang="ts" setup>
import { logoutApi } from '~/utils/auth.api'

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const router = useRouter()

const logout = async () => {
  isLoadingStore.set(true)
  try {
    await logoutApi()
  } catch (e) {
  } finally {
    authStore.clear()
    // флаг чтобы login.vue не делал лишний GET /me сразу после выхода
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('justLoggedOut', '1')
    await router.push('/login')
    isLoadingStore.set(false)
  }
}
</script>

<template>
  <aside class="px-5 py-8 bg-gray-800 h-full relative text-white">
    <div class="mb-10 flex justify-center">
      <NuxtLink to="/" >
        <NuxtImg src="/logo.svg" alt="logo" width="140px" />
      </NuxtLink>
    </div>

    <button class="absolute top-2 right-3 transition-colors hover:text-primary"
    @click="logout"
    >
      <Icon name="line-md:logout" size="22"/>
    </button>
    <LayoutMenu/>
  </aside>
</template>
