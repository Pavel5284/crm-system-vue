import { defineStore } from 'pinia'

export interface FilterableCard {
    name?: string | null
    company: string | null
    companyName: string | null
    responsibleName: string | null
    deadline: string | null
    createdAt: string
    price: number
}

function normalizeQuery(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase().replace(/ё/g, 'е')
}

// Фильтры доски (Этап 7). Применяются локально к загруженным сделкам
// в pages/index.vue при построении board — без новых запросов.
export const useDealFiltersStore = defineStore('deal-filters', {
    state: () => ({
        query: '',
        company: '',
        responsible: '',
        deadlineFrom: '',
        deadlineTo: '',
        createdFrom: '',
        createdTo: '',
        amountMin: '',
        amountMax: '',
    }),
    actions: {
        clear() {
            this.$reset()
        },
        matches(card: FilterableCard): boolean {
            // Название сделки — свободный текстовый поиск по подстроке.
            const nameQuery = normalizeQuery(this.query)
            if (nameQuery) {
                const haystack = normalizeQuery(card.name)
                if (!haystack.includes(nameQuery)) return false
            }
            // Компания — точное совпадение из выпадающего меню.
            // Сверяем с обоими полями: deal.company и customerName (companyName),
            // т.к. на карточке отображается companyName, а в форме есть оба.
            if (this.company && card.company !== this.company && card.companyName !== this.company) return false
            if (this.responsible && card.responsibleName !== this.responsible) return false
            if (this.deadlineFrom || this.deadlineTo) {
                if (!card.deadline) return false
                const day = card.deadline.slice(0, 10)
                if (this.deadlineFrom && day < this.deadlineFrom) return false
                if (this.deadlineTo && day > this.deadlineTo) return false
            }
            // Дата создания — отдельный фильтр (createdAt есть всегда,
            // в отличие от deadline, который у новых сделок null).
            if (this.createdFrom || this.createdTo) {
                const day = (card.createdAt ?? '').slice(0, 10)
                if (!day) return false
                if (this.createdFrom && day < this.createdFrom) return false
                if (this.createdTo && day > this.createdTo) return false
            }
            const min = this.amountMin === '' ? null : Number(this.amountMin)
            if (min !== null && !Number.isNaN(min) && card.price < min) return false
            const max = this.amountMax === '' ? null : Number(this.amountMax)
            if (max !== null && !Number.isNaN(max) && card.price > max) return false
            return true
        },
    },
})
