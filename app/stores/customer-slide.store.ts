import type { CustomerDto } from "~/types/backend.contracts";

export const useCustomerSlideStore = defineStore('customer-store', {
    state: (): { customer: CustomerDto | null; isOpen: boolean } => ({
        customer: null,
        isOpen: false,
    }),
    actions: {
        clear() {
            this.customer = null
            this.isOpen = false
        },
        set(customer: CustomerDto) {
            this.customer = customer
            this.isOpen = true
        },
        toggle() {
            this.isOpen = !this.isOpen
        }
    }
})
