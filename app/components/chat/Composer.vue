<script setup lang="ts">
const emit = defineEmits<{
  sent: []
}>()

const { t } = useI18n()
const chatStore = useChatStore()
const { sendTyping } = useChatSocket()

const messageText = ref('')
let typingTimer: ReturnType<typeof setTimeout> | null = null

watch(messageText, (v) => {
  if (!chatStore.selectedPartner) return
  sendTyping(chatStore.selectedPartner.id, !!v)
  if (typingTimer) clearTimeout(typingTimer)
  if (v) {
    typingTimer = setTimeout(() => sendTyping(chatStore.selectedPartner!.id, false), 2000)
  }
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
})

const send = async () => {
  const text = messageText.value.trim()
  if (!text || !chatStore.selectedPartner) return
  sendTyping(chatStore.selectedPartner.id, false)
  await chatStore.sendMessage(text)
  messageText.value = ''
  emit('sent')
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="p-3 border-t border-border bg-card">
    <div class="flex gap-2 items-center">
      <div class="flex-1 min-w-0 [&_p]:hidden">
        <UiInput
          v-model="messageText"
          :placeholder="t('chats.inputPlaceholder')"
          class="w-full"
          @keydown="onKeyDown"
          :disabled="chatStore.isSending"
        />
      </div>
      <UiButton :disabled="!messageText.trim() || chatStore.isSending" @click="send">
        <Icon v-if="chatStore.isSending" name="lucide:loader-2" size="16" class="animate-spin" />
        <Icon v-else name="lucide:send" size="16" />
      </UiButton>
    </div>
  </div>
</template>
