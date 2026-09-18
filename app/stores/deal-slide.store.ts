import type { ICard } from "~/components/kanban/kanban.types";

export const useDealSlideStore = defineStore('deal-store', {
    state: (): { card: ICard | null; isOpen: boolean; pendingTargetStage: string | null } => ({
        card: null,
        isOpen: false,
        // Этап, выбранный через drag/select вне слайдовера: требует
        // подтверждения с обязательным комментарием (Этап 6).
        pendingTargetStage: null,
    }),
    actions: {
        clear() {
            this.card = null
            this.isOpen = false
            this.pendingTargetStage = null
        },
        set(card: ICard) {
            this.card = card
            this.isOpen = true
            this.pendingTargetStage = null
        },
        toggle() {
            this.isOpen = !this.isOpen
        },
        moveRequest(card: ICard, targetStage: string) {
            this.card = card
            this.isOpen = true
            this.pendingTargetStage = targetStage
        },
        clearPending() {
            this.pendingTargetStage = null
        }
    }
})