interface IAuthStore {
    email: string,
    name: string,
    status: boolean,
}

const defaultValues: {user: IAuthStore} = {
    user:{
        email: '',
        name: '',
        status: false,
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => defaultValues,
    getters: {
        isAuth: state => state.user.isAuth,
    },
    actions: {
        clear() {
            this.$patch(defaultValues)
        }
    },
    set(input: IAuthStore){
        this.$patch({user: input})
    }
})

export const useIsLoadingStore = defineStore('isLoading', {
    state: () => ({
        isLoading: true
    }),
    actions: {
        set(data: boolean){
            this.$patch({isLoading: data})
        }
    }
})