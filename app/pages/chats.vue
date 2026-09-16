<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { useDebounceFn } from '@vueuse/core'
import type { ChatUser } from '~/types/backend.contracts'

const { t, locale } = useI18n()
useSeoMeta({ title: t('chats.seoTitle') })

const authStore = useAuthStore()
const chatStore = useChatStore()
const { typingPartnerId, sendTyping } = useChatSocket()

const searchQuery = ref('')
const messageText = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

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

onMounted(async () => {
  if (authStore.isAuth) await chatStore.loadConversations()
  nextTick(observeUnreadMessages)
})

onUnmounted(() => {
  // увиденное на экране — фиксируем, даже если уходим (fire-and-forget)
  if (readFlushTimer) {
    clearTimeout(readFlushTimer)
    readFlushTimer = null
  }
  void flushVisibleReads()
  readObserver?.disconnect()
  readObserver = null
})

watch(() => authStore.isAuth, async (v) => {
  if (v) await chatStore.loadConversations()
})

const selectPartner = async (user: ChatUser) => {
  await chatStore.selectPartner(user)
  searchQuery.value = ''
  chatStore.searchResults = []
  nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => chatStore.selectedMessages.length, () => {
  // при подгрузке истории наверх не дёргаем скролл (позицию правит loadOlderOnScroll);
  // новое сообщение скроллим вниз, только если юзер и так внизу
  const el = messagesContainer.value
  const nearBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 200
  nextTick(() => {
    if (nearBottom && !isLoadingOlder) scrollToBottom()
  })
  nextTick(observeUnreadMessages)
})
watch(() => chatStore.selectedPartner?.id, () => {
  nextTick(scrollToBottom)
  nextTick(observeUnreadMessages)
})

const isTyping = computed(() => typingPartnerId.value === chatStore.selectedPartner?.id)

let typingTimer: ReturnType<typeof setTimeout> | null = null
let isLoadingOlder = false

// Подгрузка истории скроллом вверх с сохранением позиции
const onMessagesScroll = async (): Promise<void> => {
  const el = messagesContainer.value
  const partnerId = chatStore.selectedPartner?.id
  if (!el || !partnerId || isLoadingOlder) return
  if (chatStore.isLoadingMessages || chatStore.isLoadingOlder) return
  if (chatStore.messagesHasMore[partnerId] === false) return
  if (el.scrollTop > 120) return
  isLoadingOlder = true
  const prevHeight = el.scrollHeight
  const prevTop = el.scrollTop
  try {
    await chatStore.loadOlderMessages(partnerId)
  } finally {
    await nextTick()
    el.scrollTop = el.scrollHeight - prevHeight + prevTop
    isLoadingOlder = false
  }
}
watch(messageText, (v) => {
  if (!chatStore.selectedPartner) return
  sendTyping(chatStore.selectedPartner.id, !!v)
  if (typingTimer) clearTimeout(typingTimer)
  if (v) {
    typingTimer = setTimeout(() => sendTyping(chatStore.selectedPartner!.id, false), 2000)
  }
})

const send = async () => {
  const text = messageText.value.trim()
  if (!text || !chatStore.selectedPartner) return
  sendTyping(chatStore.selectedPartner.id, false)
  await chatStore.sendMessage(text)
  messageText.value = ''
  nextTick(scrollToBottom)
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s?.trim() ?? '')
const displayName = (u: { name: string; email: string }) => {
  if (!u?.name || isUuid(u.name)) return u.email
  return u.name
}
const getInitials = (name: string, email: string) => {
  const n = (isUuid(name) ? '' : name)?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

const filteredConversations = computed(() => chatStore.conversations)

const showSearchResults = computed(() => !!searchQuery.value.trim() && chatStore.searchResults.length > 0)

// --- «Прочитано» по факту просмотра: сообщение помечается, только когда
// пользователь пролистал до него и увидел на экране (IntersectionObserver).
// threshold 0.5 для очень высоких пузырей недостижим — берём 0.3.
let readObserver: IntersectionObserver | null = null
const pendingVisibleIds = new Set<string>()
let readFlushTimer: ReturnType<typeof setTimeout> | null = null

const isIncomingUnread = (m: { id: string; senderId: string; read: boolean }): boolean =>
  m.senderId !== authStore.user.id && !m.read

function scheduleReadFlush(): void {
  if (readFlushTimer) return
  readFlushTimer = setTimeout(() => {
    readFlushTimer = null
    void flushVisibleReads()
  }, 400)
}

async function flushVisibleReads(): Promise<void> {
  if (pendingVisibleIds.size === 0 || document.hidden) {
    pendingVisibleIds.clear()
    return
  }
  const partnerId = chatStore.selectedPartner?.id
  if (!partnerId) {
    pendingVisibleIds.clear()
    return
  }
  const msgs = chatStore.selectedMessages
  const visibleIdx = msgs
    .map((m, i) => (pendingVisibleIds.has(m.id) && isIncomingUnread(m) ? i : -1))
    .filter((i) => i >= 0)
  pendingVisibleIds.clear()
  if (visibleIdx.length === 0) return
  // «вплоть до самого нижнего увиденного» — всё выше тоже увидено
  const upTo = msgs[Math.max(...visibleIdx)]!
  await chatStore.markVisibleMessagesRead(partnerId, upTo.id)
}

function observeUnreadMessages(): void {
  readObserver?.disconnect()
  readObserver = null
  pendingVisibleIds.clear()
  if (readFlushTimer) {
    clearTimeout(readFlushTimer)
    readFlushTimer = null
  }
  const root = messagesContainer.value
  if (!root || !chatStore.selectedPartner || typeof IntersectionObserver === 'undefined') return
  readObserver = new IntersectionObserver((entries) => {
    if (document.hidden) return
    let hit = false
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = (entry.target as HTMLElement).dataset.messageId
        if (id) {
          pendingVisibleIds.add(id)
          hit = true
        }
      }
    }
    if (hit) scheduleReadFlush()
  }, { root, threshold: 0.3 })
  root.querySelectorAll('[data-incoming="true"]').forEach((el) => readObserver!.observe(el))
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-80px)] rounded-lg border border-border bg-card overflow-hidden">
    <div class="px-6 py-4 border-b border-border flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold">{{ t('chats.title') }}</h1>
        <p class="text-xs text-muted-foreground">{{ t('chats.description') }}</p>
      </div>
      <div class="text-xs text-muted-foreground hidden sm:block">
        {{ authStore.user.name }} - {{ authStore.user.email }}
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <div class="w-full sm:w-[340px] border-r border-border flex flex-col min-h-0 shrink-0">
        <div class="p-3 border-b border-border">
          <div class="relative">
            <Icon name="lucide:search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
              class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
              @click="selectPartner(u)"
            >
              <img v-if="u.avatarUrl" :src="u.avatarUrl" class="w-9 h-9 rounded-full object-cover border border-border" />
              <div v-else class="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold border border-border">
                {{ getInitials(displayName(u), u.email) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">{{ displayName(u) }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ u.email }}</p>
              </div>
              <Icon name="lucide:message-circle" size="16" class="text-muted-foreground shrink-0" />
            </button>
          </div>

          <div v-else>
            <div v-if="chatStore.isLoadingConversations" class="p-4 text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> {{ t('chats.conversationsLoading') }}</div>
            <div v-else-if="!filteredConversations.length" class="p-6 text-center">
              <Icon name="lucide:messages-square" size="32" class="mx-auto text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">{{ t('chats.noConversations') }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ t('chats.noConversationsHint') }}</p>
            </div>
            <div v-else class="p-2 space-y-1">
              <button
                v-for="c in filteredConversations"
                :key="c.partner.id"
                class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                :class="chatStore.selectedPartner?.id === c.partner.id && 'bg-accent'"
                @click="selectPartner(c.partner)"
              >
                <img v-if="c.partner.avatarUrl" :src="c.partner.avatarUrl" class="w-9 h-9 rounded-full object-cover border border-border" />
                <div v-else class="w-9 h-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold border border-border">
                  {{ getInitials(displayName(c.partner), c.partner.email) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{{ displayName(c.partner) }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ c.lastMessage.text }}</p>
                </div>
                <div class="text-[10px] text-muted-foreground shrink-0">
                  {{ formatDate(c.lastMessage.createdAt, 'full', locale) }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col min-w-0 bg-background/50">
        <div v-if="!chatStore.selectedPartner" class="flex-1 grid place-items-center p-8 text-center">
          <div>
            <Icon name="lucide:message-circle-more" size="48" class="mx-auto text-muted-foreground mb-3" />
            <p class="text-sm font-medium">{{ t('chats.noMessages') }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('chats.noMessagesHint') }}</p>
          </div>
        </div>

        <template v-else>
          <div class="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
            <img v-if="chatStore.selectedPartner.avatarUrl" :src="chatStore.selectedPartner.avatarUrl" class="w-8 h-8 rounded-full object-cover border border-border" />
            <div v-else class="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
              {{ getInitials(displayName(chatStore.selectedPartner), chatStore.selectedPartner.email) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ displayName(chatStore.selectedPartner) }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ chatStore.selectedPartner.email }}</p>
            </div>
            <UiButton variant="ghost" size="sm" class="ml-auto" @click="chatStore.clearSelected()">{{ t('chats.close') }}</UiButton>
          </div>

          <div ref="messagesContainer" class="flex-1 overflow-auto p-4 space-y-3" @scroll="onMessagesScroll">
            <div v-if="chatStore.isLoadingMessages" class="text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> {{ t('common.loading') }}</div>
            <div v-if="(isLoadingOlder || chatStore.isLoadingOlder) && !chatStore.isLoadingMessages && chatStore.selectedMessages.length" class="text-xs text-muted-foreground flex items-center justify-center gap-2 py-1"><Icon name="lucide:loader-2" size="14" class="animate-spin"/></div>
            <div v-if="!chatStore.isLoadingMessages && !chatStore.selectedMessages.length" class="text-center py-12">
              <p class="text-sm text-muted-foreground">{{ t('chats.noMessagesHint') }}</p>
            </div>
            <div v-else v-for="m in chatStore.selectedMessages" :key="m.id" class="flex" :class="m.senderId === authStore.user.id ? 'justify-end' : 'justify-start'" :data-message-id="m.id" :data-incoming="m.senderId !== authStore.user.id ? 'true' : 'false'">
              <div class="max-w-[70%] rounded-2xl px-3 py-2 text-sm" :class="m.senderId === authStore.user.id ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'">
                <p class="whitespace-pre-wrap break-words">{{ m.text }}</p>
                <p class="text-[10px] mt-1 opacity-70">{{ formatDate(m.createdAt, 'full', locale) }}</p>
              </div>
            </div>
            <p v-if="isTyping" class="text-xs text-muted-foreground italic">{{ t('chats.typing') }}</p>
          </div>

          <div class="p-3 border-t border-border bg-card">
            <div class="flex gap-2 items-end">
              <UiInput
                v-model="messageText"
                :placeholder="t('chats.inputPlaceholder')"
                class="flex-1"
                @keydown="onKeyDown"
                :disabled="chatStore.isSending"
              />
              <UiButton :disabled="!messageText.trim() || chatStore.isSending" @click="send">
                <Icon v-if="chatStore.isSending" name="lucide:loader-2" size="16" class="animate-spin" />
                <Icon v-else name="lucide:send" size="16" />
              </UiButton>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

