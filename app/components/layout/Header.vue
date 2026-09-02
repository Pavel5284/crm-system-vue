<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'

const authStore = useAuthStore()
const { status, notifications, connect, disconnect, clear } = useNotifications()

const showNotifications = ref(false)
const showProfile = ref(false)

const unreadCount = computed(() => notifications.value.length)

const initials = computed(() => {
  const name = authStore.user.name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  const email = authStore.user.email?.trim()
  return email ? email[0].toUpperCase() : '?'
})

const statusColor: Record<string, string> = {
  connected: 'bg-green-500',
  connecting: 'bg-yellow-500',
  disconnected: 'bg-gray-400',
  unauthorized: 'bg-red-500',
  error: 'bg-red-500',
}

const dropdownRef = ref<HTMLElement | null>(null)
const profileRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) showNotifications.value = false
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) showProfile.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  if (authStore.isAuth) connect()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  disconnect()
})

watch(() => authStore.isAuth, (v) => {
  if (v) connect()
  else {
    disconnect()
    clear()
  }
})
</script>

<template>
  <header class="h-14 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
    <!-- left: spacer / breadcrumb could go here -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <span class="hidden sm:inline">CRM System</span>
    </div>

    <div class="flex items-center gap-3">
      <!-- notifications -->
      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          class="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
          aria-label="Уведомления"
          @click.stop="showNotifications = !showNotifications"
        >
          <Icon name="lucide:bell" size="18" />
          <span
            v-if="unreadCount"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
          <span :class="['absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', statusColor[status] ?? 'bg-gray-400']" />
        </button>

        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
        >
          <div class="px-4 py-3 flex items-center justify-between border-b border-border">
            <p class="text-sm font-semibold">Уведомления</p>
            <div class="flex items-center gap-2">
              <span :class="['h-2 w-2 rounded-full', statusColor[status]]" />
              <span class="text-xs text-muted-foreground capitalize">{{ status }}</span>
              <button v-if="unreadCount" type="button" class="text-xs text-primary hover:underline ml-2" @click="clear">Очистить</button>
            </div>
          </div>

          <div v-if="notifications.length" class="max-h-80 overflow-auto divide-y divide-border">
            <div v-for="(n, i) in notifications" :key="i" class="px-4 py-3 text-xs leading-relaxed hover:bg-accent/50">
              <pre class="whitespace-pre-wrap break-words font-sans text-xs">{{ typeof n === 'string' ? n : JSON.stringify(n, null, 2) }}</pre>
            </div>
          </div>
          <div v-else class="px-4 py-10 text-center text-sm text-muted-foreground">
            Пока нет уведомлений
          </div>

          <div class="px-4 py-2 border-t border-border bg-muted/30 flex justify-between items-center">
            <NuxtLink to="/ws-test" class="text-xs text-primary hover:underline" @click="showNotifications=false">WS-тест</NuxtLink>
            <span class="text-[11px] text-muted-foreground">{{ unreadCount }} всего</span>
          </div>
        </div>
      </div>

      <!-- divider -->
      <div class="h-6 w-px bg-border mx-1" />

      <!-- profile -->
      <div ref="profileRef" class="relative">
        <button
          type="button"
          class="flex items-center gap-3 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors"
          @click.stop="showProfile = !showProfile"
        >
          <img
            v-if="authStore.user.avatarUrl"
            :src="authStore.user.avatarUrl"
            alt="avatar"
            class="h-8 w-8 rounded-full object-cover shrink-0 border border-border"
          />
          <div v-else class="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold shrink-0">
            {{ initials }}
          </div>
          <div class="hidden sm:block text-left leading-tight">
            <p class="text-sm font-medium leading-none">{{ authStore.user.name || '—' }}</p>
            <p class="text-xs text-muted-foreground leading-none">{{ authStore.user.email }}</p>
          </div>
          <Icon name="lucide:chevron-down" size="14" class="hidden sm:block text-muted-foreground" :class="{ 'rotate-180': showProfile }" />
        </button>

        <div
          v-if="showProfile"
          class="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
        >
          <div class="px-4 py-3">
            <p class="text-sm font-medium">{{ authStore.user.name }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ authStore.user.email }}</p>
          </div>
          <div class="border-t border-border p-1">
            <NuxtLink to="/settings" class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent" @click="showProfile=false">
              <Icon name="radix-icons:gear" size="14" /> Настройки
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
