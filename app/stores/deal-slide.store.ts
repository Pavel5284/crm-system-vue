import type { ICard } from "~/components/kanban/kanban.types";

export const useDealSlideStore = defineStore('deal-store', {
    state: (): { card: ICard | null; isOpen: boolean } => ({
        card: null,
        isOpen: false,
    }),
    actions: {
        clear() {
            this.card = null
            this.isOpen = false
        },
        set(card: ICard) {
            this.card = card
            this.isOpen = true
        },
        toggle() {
            this.isOpen = !this.isOpen
        }
    }
})