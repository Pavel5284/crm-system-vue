<script setup lang="ts">
import { formatDate } from '~/utils/formatDate'
import { useDebounceFn } from '@vueuse/core'

useSeoMeta({ title: 'Чаты | CRM System' })

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
})

watch(() => authStore.isAuth, async (v) => {
  if (v) await chatStore.loadConversations()
})

const selectPartner = async (user: { id: string; name: string; email: string; avatarUrl: string | null }) => {
  await chatStore.selectPartner(user as never)
  searchQuery.value = ''
  chatStore.searchResults = []
  nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => chatStore.selectedMessages.length, () => nextTick(scrollToBottom))
watch(() => chatStore.selectedPartner?.id, () => nextTick(scrollToBottom))

const isTyping = computed(() => typingPartnerId.value === chatStore.selectedPartner?.id)

let typingTimer: ReturnType<typeof setTimeout> | null = null
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
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-80px)] rounded-lg border border-border bg-card overflow-hidden">
    <!-- header -->
    <div class="px-6 py-4 border-b border-border flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold">Чаты</h1>
        <p class="text-xs text-muted-foreground">Найди пользователя и напиши личное сообщение</p>
      </div>
      <div class="text-xs text-muted-foreground hidden sm:block">
        {{ authStore.user.name }} · {{ authStore.user.email }}
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <!-- left: search + conversations -->
      <div class="w-full sm:w-[340px] border-r border-border flex flex-col min-h-0 shrink-0">
        <div class="p-3 border-b border-border">
          <div class="relative">
            <Icon name="lucide:search" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <UiInput v-model="searchQuery" placeholder="Поиск по имени или email..." class="pl-9" />
          </div>
          <p v-if="chatStore.isSearching" class="text-[11px] text-muted-foreground mt-2 flex items-center gap-1"><Icon name="lucide:loader-2" size="12" class="animate-spin"/> Поиск...</p>
        </div>

        <div class="flex-1 overflow-auto">
          <!-- search results -->
          <div v-if="showSearchResults" class="p-2">
            <p class="text-[11px] text-muted-foreground px-2 py-1">Найдено: {{ chatStore.searchResults.length }}</p>
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

          <!-- conversations -->
          <div v-else>
            <div v-if="chatStore.isLoadingConversations" class="p-4 text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> Загрузка чатов...</div>
            <div v-else-if="!filteredConversations.length" class="p-6 text-center">
              <Icon name="lucide:messages-square" size="32" class="mx-auto text-muted-foreground mb-2" />
              <p class="text-sm text-muted-foreground">Пока нет чатов</p>
              <p class="text-xs text-muted-foreground mt-1">Найди пользователя выше и начни диалог</p>
            </div>
            <div v-else class="p-2 space-y-1">
              <button
                v-for="c in filteredConversations"
                :key="c.partner.id"
                class="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                :class="chatStore.selectedPartner?.id === c.partner.id && 'bg-accent'"
                @click="selectPartner(c.partner as never)"
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
                  {{ formatDate(c.lastMessage.createdAt, 'full') }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- right: messages -->
      <div class="flex-1 flex flex-col min-w-0 bg-background/50">
        <div v-if="!chatStore.selectedPartner" class="flex-1 grid place-items-center p-8 text-center">
          <div>
            <Icon name="lucide:message-circle-more" size="48" class="mx-auto text-muted-foreground mb-3" />
            <p class="text-sm font-medium">Выбери чат или найди пользователя</p>
            <p class="text-xs text-muted-foreground mt-1">Поиск работает по имени и email зарегистрированных пользователей</p>
          </div>
        </div>

        <template v-else>
          <!-- chat header -->
          <div class="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
            <img v-if="chatStore.selectedPartner.avatarUrl" :src="chatStore.selectedPartner.avatarUrl" class="w-8 h-8 rounded-full object-cover border border-border" />
            <div v-else class="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
              {{ getInitials(displayName(chatStore.selectedPartner), chatStore.selectedPartner.email) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold truncate">{{ displayName(chatStore.selectedPartner) }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ chatStore.selectedPartner.email }}</p>
            </div>
            <UiButton variant="ghost" size="sm" class="ml-auto" @click="chatStore.clearSelected()">Закрыть</UiButton>
          </div>

          <!-- messages -->
          <div ref="messagesContainer" class="flex-1 overflow-auto p-4 space-y-3">
            <div v-if="chatStore.isLoadingMessages" class="text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> Загрузка...</div>
            <div v-else-if="!chatStore.selectedMessages.length" class="text-center py-12">
              <p class="text-sm text-muted-foreground">Нет сообщений. Начни диалог!</p>
            </div>
            <div v-else v-for="m in chatStore.selectedMessages" :key="m.id" class="flex" :class="m.senderId === authStore.user.id ? 'justify-end' : 'justify-start'">
              <div class="max-w-[70%] rounded-2xl px-3 py-2 text-sm" :class="m.senderId === authStore.user.id ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'">
                <p class="whitespace-pre-wrap break-words">{{ m.text }}</p>
                <p class="text-[10px] mt-1 opacity-70">{{ formatDate(m.createdAt, 'full') }}</p>
              </div>
            </div>
            <p v-if="isTyping" class="text-xs text-muted-foreground italic">собеседник печатает...</p>
          </div>

          <!-- input -->
          <div class="p-3 border-t border-border bg-card">
            <div class="flex gap-2 items-end">
              <UiInput
                v-model="messageText"
                placeholder="Написать сообщение..."
                class="flex-1"
                @keydown="onKeyDown"
                :disabled="chatStore.isSending"
              />
              <UiButton :disabled="!messageText.trim() || chatStore.isSending" @click="send">
                <Icon v-if="chatStore.isSending" name="lucide:loader-2" size="16" class="animate-spin" />
                <Icon v-else name="lucide:send" size="16" />
              </UiButton>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1">Enter - отправить, Shift+Enter - новая строка</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
