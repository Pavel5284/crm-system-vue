<script setup lang="ts">
import { MENU_DATA } from "@/components/layout/menu"

const chatStore = useChatStore()
const authStore = useAuthStore()
const { t } = useI18n()

watch(() => authStore.isAuth, (v) => {
  if (v) void chatStore.fetchUnreadCount()
})

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (authStore.isAuth) void chatStore.fetchUnreadCount()
  poll = setInterval(() => {
    if (authStore.isAuth) void chatStore.fetchUnreadCount()
  }, 15000)
})
onUnmounted(() => {
  if (poll) clearInterval(poll)
})
</script>

<template>
  <div>
    <template v-for="item in MENU_DATA" :key="item.name">
      <span
        v-if="item.disabled"
        class="flex items-center py-1 px-3 rounded-lg w-full mb-2.5 bg-gray-700/30 text-white/40 cursor-not-allowed select-none"
        :title="t('common.soon')"
      >
        <Icon :name="item.icon" class="mr-3 opacity-60" />
        <span class="flex-1">{{ t(item.name) }}</span>
        <span class="ml-auto text-[10px] border border-white/20 rounded px-1.5 py-0.5">Soon</span>
      </span>
      <NuxtLink
        v-else
        :to="item.url"
        class="flex items-center py-1 px-3 rounded-lg w-full hover:bg-gray-700 hover:shadow transition-all mb-2.5"
        active-class="bg-gray-700 shadow"
      >
        <Icon :name="item.icon" class="mr-3" />
        <span class="flex-1">{{ t(item.name) }}</span>
        <span
          v-if="item.url === '/chats' && chatStore.unreadCount > 0"
          class="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 grid place-items-center rounded-full px-1.5"
        >
          {{ chatStore.unreadCount > 99 ? "99+" : chatStore.unreadCount }}
        </span>
      </NuxtLink>
    </template>
  </div>
</template>
