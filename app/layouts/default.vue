<script setup lang="ts">
import { clearTokens } from '~/utils/api'
import { getMeApi } from '~/utils/auth.api'

const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const router = useRouter()

const checkAuth = async () => {
  try{
    const user = await getMeApi()
    if (user) authStore.set({email: user.email, name: user.name, status: true})
  } catch (error) {
    clearTokens()
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
    <LayoutLoader v-if="isLoadingStore.isLoading"/>
    <section v-else :class="{grid: authStore.isAuth}" style="min-height: 100vh">
      <LayoutSidebar v-if="authStore.isAuth"/>
      <div style="padding: 20px">
        <slot />
      </div>
    </section>
  </UApp>
</template>

<style scoped>
.grid{
  display: grid;
  grid-template-columns: 1fr 6fr;

}
</style>