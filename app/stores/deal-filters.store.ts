import { defineStore } from 'pinia'

export interface FilterableCard {
    company: string
    companyName: string
    responsibleName: string | null
    deadline: string | null
    price: number
}

// Фильтры доски (Этап 7). Применяются локально к загруженным сделкам
// в pages/index.vue при построении board — без новых запросов.
export const useDealFiltersStore = defineStore('deal-filters', {
    state: () => ({
        company: '',
        responsible: '',
        deadlineFrom: '',
        deadlineTo: '',
        amountMin: '',
        amountMax: '',
    }),
    actions: {
        clear() {
            this.$reset()
        },
        matches(card: FilterableCard): boolean {
            const companyQuery = this.company.trim().toLowerCase()
            if (companyQuery) {
                const haystack = `${card.company} ${card.companyName}`.toLowerCase()
                if (!haystack.includes(companyQuery)) return false
            }
            if (this.responsible && card.responsibleName !== this.responsible) return false
            if (this.deadlineFrom || this.deadlineTo) {
                if (!card.deadline) return false
                const day = card.deadline.slice(0, 10)
                if (this.deadlineFrom && day < this.deadlineFrom) return false
                if (this.deadlineTo && day > this.deadlineTo) return false
            }
            const min = this.amountMin === '' ? null : Number(this.amountMin)
            if (min !== null && !Number.isNaN(min) && card.price < min) return false
            const max = this.amountMax === '' ? null : Number(this.amountMax)
            if (max !== null && !Number.isNaN(max) && card.price > max) return false
            return true
        },
    },
})
