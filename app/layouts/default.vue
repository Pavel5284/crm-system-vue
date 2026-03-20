<script setup lang="ts">
const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const router = useRouter()

const checkAuth = async () => {
  const {$appwrite} = useNuxtApp()
  const account = $appwrite.account
  try{
    const user = await account.get()
    if (user) authStore.set({email: user.email, name: user.name, status: user.status})
  } catch (error) {
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
  <LayoutLoader v-if="isLoadingStore.isLoading"/>
  <section v-else :class="{grid: authStore.isAuth}" style="min-height: 100vh">
    <LayoutSidebar v-if="authStore.isAuth"/>
    <div style="padding: 20px">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.grid{
  display: grid;
  grid-template-columns: 1fr 6fr;

}
</style>
