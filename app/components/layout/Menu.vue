<script setup lang="ts">
import { MENU_DATA } from '@/components/layout/menu'

const chatStore = useChatStore()
const authStore = useAuthStore()

watch(() => authStore.isAuth, (v) => {
  if (v) chatStore.fetchUnreadCount()
})

// также обновляем при новых сообщениях через сокет (уже в receiveMessage)
// периодический полл как фолбэк если сокет отвалился
let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (authStore.isAuth) chatStore.fetchUnreadCount()
  poll = setInterval(() => {
    if (authStore.isAuth) chatStore.fetchUnreadCount()
  }, 15000)
})
onUnmounted(() => {
  if (poll) clearInterval(poll)
})
</script>

<template>
  <div>
    <NuxtLink
        class="flex items-center py-1 px-3 rounded-lg w-full
        hover:bg-gray-700 hover:shadow transition-all mb-2.5"
        v-for="item in MENU_DATA"
        :key="item.name"
        :to="item.url"
    >
      <Icon :name="item.icon" class="mr-3"/>
      <span class="flex-1">{{item.name}}</span>
      <span
        v-if="item.url === '/chats' && chatStore.unreadCount > 0"
        class="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 grid place-items-center rounded-full px-1.5"
      >
        {{ chatStore.unreadCount > 99 ? '99+' : chatStore.unreadCount }}
      </span>
    </NuxtLink>
  </div>
</template>