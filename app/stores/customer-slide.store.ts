import type { ICustomer } from "~/types/deals.types";

export const useCustomerSlideStore = defineStore('customer-store', {
    state: (): { customer: ICustomer | null; isOpen: boolean } => ({
        customer: null,
        isOpen: false,
    }),
    actions: {
        clear() {
            this.customer = null
            this.isOpen = false
        },
        set(customer: ICustomer) {
            this.customer = customer
            this.isOpen = true
        },
        toggle() {
            this.isOpen = !this.isOpen
        }
    }
})
