<script lang="ts" setup>
const isLoadingStore = useIsLoadingStore()
const authStore = useAuthStore()

const router = useRouter()

const logout = async () => {
  isLoadingStore.set(true)
  const {$appwrite} = useNuxtApp()
  const account = $appwrite.account
  await account.deleteSession('current')
  authStore.clear()
  await router.push('/login')
  isLoadingStore.set(false)
}
</script>

<template>
  <aside class="px-5 py-8 bg-gray-800 h-full relative text-white">
    <div class="mb-10 flex justify-center">
      <NuxtLink to="/" >
        <NuxtImg src="/logo.svg" alt="logo" width="100px" />
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
