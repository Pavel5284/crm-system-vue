<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'
import { useOpenDeal } from '~/composables/useOpenDeal'
import type { NotificationDto } from '~/types/backend.contracts'
import {
  getNotificationDealId,
  getNotificationDetails,
  getNotificationIcon,
  getNotificationSubtitle,
  getNotificationTitleKey,
} from '~/utils/notifications.presentation'

defineEmits<{ (e: 'toggle-menu'): void }>()

const { t, locale } = useI18n()
const authStore = useAuthStore()
const {
  items: notifications,
  unreadCount,
  hasUnread,
  connect,
  disconnect,
  clear,
  markRead,
  markAllRead,
} = useNotifications()
const { openDealById } = useOpenDeal()

const showNotifications = ref(false)
const showProfile = ref(false)

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

const dropdownRef = ref<HTMLElement | null>(null)
const profileRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) showNotifications.value = false
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) showProfile.value = false
}

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// Клик по уведомлению: помечаем прочитанным и открываем слайовер сделки,
// если в payload есть dealId. Будущие типы без dealId — только mark read.
const onNotificationClick = async (n: NotificationDto): Promise<void> => {
  const dealId = getNotificationDealId(n)
  showNotifications.value = false
  if (!n.read) void markRead(n.id)
  if (dealId) await openDealById(dealId)
}

const onMarkAllRead = async (): Promise<void> => {
  await markAllRead()
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
  <header class="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <button class="lg:hidden -ml-2 h-9 w-9 grid place-items-center rounded-md hover:bg-accent border border-transparent hover:border-border" aria-label="Open menu" @click="$emit('toggle-menu')">
        <Icon name="lucide:menu" size="20" />
      </button>
      <span class="hidden sm:inline">{{ t('header.crmSystem') }}</span>
    </div>

    <div class="flex items-center gap-3">
      <LayoutLangSwitcher />
      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          class="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
          :aria-label="unreadCount ? t('header.hasUnread', { count: unreadCount }) : t('header.notifications')"
          @click.stop="showNotifications = !showNotifications"
        >
          <Icon name="lucide:bell" size="18" />
          <span
            v-if="unreadCount"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold grid place-items-center"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
          <!-- Зелёный индикатор — ТОЛЬКО при непрочитанных. Статус соединения здесь не показываем. -->
          <span
            v-if="hasUnread"
            class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
          />
        </button>

        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
        >
          <div class="px-4 py-3 flex items-center justify-between border-b border-border">
            <p class="text-sm font-semibold">{{ t('header.notifications') }}</p>
            <button v-if="hasUnread" type="button" class="text-xs text-primary hover:underline" @click="onMarkAllRead">{{ t('header.markAllRead') }}</button>
          </div>

          <div v-if="notifications.length" class="max-h-80 overflow-auto divide-y divide-border">
            <button
              v-for="n in notifications"
              :key="n.id"
              type="button"
              class="w-full text-left px-4 py-3 text-xs leading-relaxed hover:bg-accent/50 flex gap-3 items-start transition-colors"
              :class="{ 'bg-accent/30': !n.read }"
              @click="onNotificationClick(n)"
            >
              <span class="mt-0.5 shrink-0 grid place-items-center h-7 w-7 rounded-full border border-border bg-muted/50">
                <Icon :name="getNotificationIcon(n.type)" size="14" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="font-semibold text-[13px] truncate">{{ t(getNotificationTitleKey(n.type)) }}</span>
                  <span v-if="!n.read" class="h-2 w-2 rounded-full bg-green-500 shrink-0" :title="t('header.unread')" />
                </span>
                <span v-if="getNotificationSubtitle(n)" class="block truncate text-foreground/90 mt-0.5">{{ getNotificationSubtitle(n) }}</span>
                <span v-if="getNotificationDetails(n)" class="block text-muted-foreground mt-0.5 break-words">{{ getNotificationDetails(n) }}</span>
                <span class="block text-[11px] text-muted-foreground mt-1">{{ formatTime(n.createdAt) }}</span>
              </span>
            </button>
          </div>
          <div v-else class="px-4 py-10 text-center text-sm text-muted-foreground">
            {{ t('header.noNotifications') }}
          </div>

          <div class="px-4 py-2 border-t border-border bg-muted/30 flex justify-end items-center">
            <span class="text-[11px] text-muted-foreground">{{ t('header.notificationsCount', { count: unreadCount }) }}</span>
          </div>
        </div>
      </div>

      <div class="h-6 w-px bg-border mx-1" />

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
              <Icon name="radix-icons:gear" size="14" /> {{ t('header.settings') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
