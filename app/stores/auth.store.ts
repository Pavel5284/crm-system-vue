import { defineStore } from 'pinia'

interface IAuthStore {
    id: string,
    email: string,
    name: string,
    status: boolean,
    avatarUrl: string | null,
    position: string | null,
    phone: string | null,
    telegram: string | null,
    isEmailVerified: boolean,
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: {
            id: '',
            email: '',
            name: '',
            status: false,
            avatarUrl: null,
            position: null,
            phone: null,
            telegram: null,
            isEmailVerified: false,
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
