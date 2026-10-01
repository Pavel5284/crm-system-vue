<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { formatDate } from '~/utils/formatDate'
import { displayName } from '~/utils/chat-display'
import type { ChatUser } from '~/types/backend.contracts'

const emit = defineEmits<{
  select: [user: ChatUser]
}>()

const { t, locale } = useI18n()
const chatStore = useChatStore()

const searchQuery = ref('')

const debouncedSearch = useDebounceFn(async (q: string) => {
  await chatStore.searchUsers(q)
}, 300)

watch(searchQuery, (v) => {
  if (!v.trim()) {
    chatStore.searchResults = []
    return
  }
  debouncedSearch(v)
})

const showSearchResults = computed(
  () => !!searchQuery.value.trim() && chatStore.searchResults.length > 0,
)

function onSelect(user: ChatUser) {
  searchQuery.value = ''
  chatStore.searchResults = []
  emit('select', user)
}
</script>

<template>
  <div
    class="w-full sm:w-[340px] sm:border-r border-border flex-col min-h-0 shrink-0 sm:flex"
    :class="chatStore.selectedPartner ? 'hidden' : 'flex'"
  >
    <div class="p-3 border-b border-border">
      <div class="relative [&_p]:hidden">
        <Icon name="lucide:search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
        <UiInput v-model="searchQuery" :placeholder="t('chats.searchPlaceholder')" class="pl-9" />
      </div>
      <p v-if="chatStore.isSearching" class="text-[11px] text-muted-foreground mt-2 flex items-center gap-1"><Icon name="lucide:loader-2" size="12" class="animate-spin"/> {{ t('chats.searching') }}</p>
    </div>

    <div class="flex-1 overflow-auto">
      <div v-if="showSearchResults" class="p-2">
        <p class="text-[11px] text-muted-foreground px-2 py-1">{{ t('chats.searchResults', { count: chatStore.searchResults.length }) }}</p>
        <button
          v-for="u in chatStore.searchResults"
          :key="u.id"
          type="button"
          class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
          @click="onSelect(u)"
        >
          <ChatAvatar :name="u.name" :email="u.email" :avatar-url="u.avatarUrl" size="md" />
          <span class="min-w-0 flex-1 block">
            <span class="block text-sm font-medium truncate">{{ displayName(u) }}</span>
            <span class="block text-xs text-muted-foreground truncate">{{ u.email }}</span>
          </span>
          <Icon name="lucide:message-circle" size="16" class="text-muted-foreground shrink-0" />
        </button>
      </div>

      <div v-else>
        <div v-if="chatStore.isLoadingConversations" class="p-4 text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> {{ t('chats.conversationsLoading') }}</div>
        <div v-else-if="!chatStore.conversations.length" class="p-6 text-center">
          <Icon name="lucide:messages-square" size="32" class="mx-auto text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">{{ t('chats.noConversations') }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ t('chats.noConversationsHint') }}</p>
        </div>
        <div v-else class="p-2 space-y-1">
          <button
            v-for="c in chatStore.conversations"
            :key="c.partner.id"
            type="button"
            class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
            :class="chatStore.selectedPartner?.id === c.partner.id && 'bg-accent'"
            @click="onSelect(c.partner)"
          >
            <ChatAvatar :name="c.partner.name" :email="c.partner.email" :avatar-url="c.partner.avatarUrl" size="md" />
            <span class="min-w-0 flex-1 block">
              <span class="block text-sm font-medium truncate">{{ displayName(c.partner) }}</span>
              <span class="block text-xs text-muted-foreground truncate">{{ c.lastMessage.text }}</span>
            </span>
            <span class="flex flex-col items-end gap-1 shrink-0">
              <span class="block text-[10px] text-muted-foreground">
                {{ formatDate(c.lastMessage.createdAt, 'full', locale) }}
              </span>
              <span
                v-if="(c.unreadCount ?? 0) > 0"
                class="min-w-[20px] h-5 grid place-items-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5"
              >
                {{ c.unreadCount > 99 ? '99+' : c.unreadCount }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
