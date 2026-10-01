import type { Ref } from 'vue'

// «Прочитано» по факту просмотра: сообщение помечается, только когда
// пользователь пролистал до него и увидел на экране (IntersectionObserver).
// threshold 0.5 для очень высоких пузырей недостижим — берём 0.3.
export function useChatReadObserver(container: Ref<HTMLElement | null>) {
  const chatStore = useChatStore()
  const authStore = useAuthStore()

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
    const root = container.value
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

  return { observeUnreadMessages, flushVisibleReads }
}
