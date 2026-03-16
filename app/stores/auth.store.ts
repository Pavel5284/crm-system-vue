import { defineStore } from 'pinia'

interface IAuthStore {
    email: string,
    name: string,
    status: boolean,
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: {
            email: '',
            name: '',
            status: false,
        } as IAuthStore,
        isAuth: false,
    }),
    actions: {
        clear() {
            this.$reset()
        },
        set(input: IAuthStore) {
            this.user = input
            this.isAuth = true
        }
    }
})

export const useIsLoadingStore = defineStore('isLoading', {
    state: () => ({
        isLoading: true
    }),
    actions: {
        set(data: boolean){
            this.isLoading = data
        }
    }
})
