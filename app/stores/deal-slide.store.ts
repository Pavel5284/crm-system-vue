import type { ICard } from "~/components/kanban/kanban.types";

export type DealHighlightField = 'company' | 'description' | 'contact' | 'responsible' | 'deadline';

export const useDealSlideStore = defineStore('deal-store', {
    state: (): {
      card: ICard | null
      isOpen: boolean
      highlightFields: DealHighlightField[]
      pendingTargetStage: string | null
    } => ({
        card: null,
        isOpen: false,
        // Поля, подсвеченные после неудачного переноса (надо заполнить/исправить).
        highlightFields: [],
        // Цель неудачного переноса: повторяется автоматически,
        // когда все подсвеченные поля заполнены.
        pendingTargetStage: null,
    }),
    actions: {
        clear() {
            this.card = null
            this.isOpen = false
            this.highlightFields = []
            this.pendingTargetStage = null
        },
        set(card: ICard) {
            this.card = card
            this.isOpen = true
            this.highlightFields = []
            this.pendingTargetStage = null
        },
        toggle() {
            this.isOpen = !this.isOpen
        },
        // Неудачный перенос: открываем карточку и подсвечиваем поля из ошибки бэкенда.
        // Отложенная цель ставится только если есть что заполнять (fields непуст),
        // иначе (роль/правило) автоповтора быть не должно.
        failMove(card: ICard, fields: DealHighlightField[], target?: string) {
            this.card = card
            this.isOpen = true
            this.highlightFields = fields
            this.pendingTargetStage = fields.length && target ? target : null
        },
        clearHighlight(field: DealHighlightField) {
            this.highlightFields = this.highlightFields.filter((f) => f !== field)
        },
        clearPending() {
            this.pendingTargetStage = null
        },
        // Забрать отложенную цель (сразу сбрасывает, чтобы не было повторов).
        consumePending(): string | null {
            const target = this.pendingTargetStage
            this.pendingTargetStage = null
            return target
        },
    }
})
