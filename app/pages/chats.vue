<script setup lang="ts">
import { displayName } from '~/utils/chat-display'
import { useChatReadObserver } from '~/composables/useChatReadObserver'
import type { ChatUser } from '~/types/backend.contracts'

const { t } = useI18n()
useSeoMeta({ title: t('chats.seoTitle') })

const authStore = useAuthStore()
const chatStore = useChatStore()
const { typingPartnerId } = useChatSocket()

const messagesContainer = ref<HTMLElement | null>(null)
const { observeUnreadMessages } = useChatReadObserver(messagesContainer)

onMounted(() => {
  // Скролл — синхронно в следующем тике, ДО сети: иначе сначала виден
  // верх списка, потом прыжок. Список диалогов догрузится фоном.
  nextTick(() => {
    restoreScrollPosition()
    observeUnreadMessages()
  })
  if (authStore.isAuth) void chatStore.loadConversations()
})

onBeforeUnmount(() => {
  const el = messagesContainer.value
  const pid = chatStore.selectedPartner?.id
  if (el && pid) chatStore.messageScrollTops[pid] = el.scrollTop
})

watch(() => authStore.isAuth, async (v) => {
  if (v) await chatStore.loadConversations()
})

const selectPartner = async (user: ChatUser) => {
  await chatStore.selectPartner(user)
  // список уже подгружен — мотаем туда, где были, либо вниз при первом открытии
  nextTick(() => {
    const el = messagesContainer.value
    const saved = chatStore.messageScrollTops[user.id]
    if (el && saved !== undefined) el.scrollTop = saved
    else scrollToBottom()
  })
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
  nextTick(observeUnreadMessages)
})

const isTyping = computed(() => typingPartnerId.value === chatStore.selectedPartner?.id)

let isLoadingOlder = false

function restoreScrollPosition(): void {
  const el = messagesContainer.value
  const pid = chatStore.selectedPartner?.id
  if (!el || !pid) return
  // стор переживает размонтирование — позиция, где были при уходе
  const saved = chatStore.messageScrollTops[pid]
  if (saved !== undefined) el.scrollTop = saved
}

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
</script>

<template>
  <div class="flex flex-col h-[calc(100dvh-150px)] sm:h-[calc(100vh-80px)] rounded-lg border border-border bg-card overflow-hidden">
    <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-base font-semibold">{{ t('chats.title') }}</h1>
        <p class="text-xs text-muted-foreground truncate">{{ t('chats.description') }}</p>
      </div>
      <div class="text-xs text-muted-foreground hidden sm:block shrink-0">
        {{ authStore.user.name }} - {{ authStore.user.email }}
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <ChatSidebar @select="selectPartner" />

      <div
        class="flex-1 flex-col min-w-0 bg-background/50 sm:flex"
        :class="chatStore.selectedPartner ? 'flex' : 'hidden'"
      >
        <div v-if="!chatStore.selectedPartner" class="flex-1 hidden sm:grid place-items-center p-8 text-center">
          <div>
            <Icon name="lucide:message-circle-more" size="48" class="mx-auto text-muted-foreground mb-3" />
            <p class="text-sm font-medium">{{ t('chats.noMessages') }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ t('chats.noMessagesHint') }}</p>
          </div>
        </div>

        <template v-else>
          <div class="px-3 sm:px-4 py-2 sm:py-3 border-b border-border flex items-center gap-2 sm:gap-3 bg-card">
            <UiButton variant="ghost" size="icon" class="sm:hidden shrink-0" @click="chatStore.clearSelected()">
              <Icon name="lucide:arrow-left" size="18" />
            </UiButton>
            <ChatAvatar
              :name="chatStore.selectedPartner.name"
              :email="chatStore.selectedPartner.email"
              :avatar-url="chatStore.selectedPartner.avatarUrl"
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate">{{ displayName(chatStore.selectedPartner) }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ chatStore.selectedPartner.email }}</p>
            </div>
            <UiButton variant="ghost" size="sm" class="ml-auto hidden sm:inline-flex" @click="chatStore.clearSelected()">{{ t('chats.close') }}</UiButton>
          </div>

          <div ref="messagesContainer" class="flex-1 overflow-auto p-3 sm:p-4 space-y-3" @scroll="onMessagesScroll">
            <div v-if="chatStore.isLoadingMessages" class="text-xs text-muted-foreground flex items-center gap-2"><Icon name="lucide:loader-2" size="14" class="animate-spin"/> {{ t('common.loading') }}</div>
            <div v-if="(isLoadingOlder || chatStore.isLoadingOlder) && !chatStore.isLoadingMessages && chatStore.selectedMessages.length" class="text-xs text-muted-foreground flex items-center justify-center gap-2 py-1"><Icon name="lucide:loader-2" size="14" class="animate-spin"/></div>
            <div v-if="!chatStore.isLoadingMessages && !chatStore.selectedMessages.length" class="text-center py-12">
              <p class="text-sm text-muted-foreground">{{ t('chats.noMessagesHint') }}</p>
            </div>
            <ChatMessageBubble
              v-else
              v-for="m in chatStore.selectedMessages"
              :key="m.id"
              :message="m"
              :mine="m.senderId === authStore.user.id"
              :data-message-id="m.id"
              :data-incoming="m.senderId !== authStore.user.id ? 'true' : 'false'"
            />
            <p v-if="isTyping" class="text-xs text-muted-foreground italic">{{ t('chats.typing') }}</p>
          </div>

          <ChatComposer @sent="scrollToBottom" />
        </template>
      </div>
    </div>
  </div>
</template>
