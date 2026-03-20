// plugins/nuxt-query.ts
import { QueryClient, QueryCache } from '@tanstack/vue-query'

export default defineNuxtPlugin({
    enforce: 'pre',
    setup(nuxtApp) {
        nuxtApp.hook('nuxt-query:configure', (getPluginOptions) => {
            const clientOptions = useRuntimeConfig().public.nuxtQuery?.queryClientOptions || {}

            const queryClient = new QueryClient({
                ...clientOptions,
                queryCache: new QueryCache({
                    onSuccess: (data: unknown) => console.log('onSuccess', { data }),
                }),
            })

            // return the plugin options which will be used
            // by the module at startup
            getPluginOptions(queryClient)
        })
    },
})
