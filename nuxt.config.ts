// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    pages: true,
    srcDir: 'app',
    compatibilityDate: '2025-07-15',
    runtimeConfig: {
        public: {
            appwriteEndpoint: process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || '',
            appwriteProjectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID || '',
            appwriteDatabaseId: process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID || ''
        }
    },
    modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/image', '@nuxt/icon', ['@nuxtjs/google-fonts', {
        families: {
            Lato: {
                wght: [300, 400, 700],
                ital: [300],
            }
        }
    }], 'nuxt-appwrite', '@pinia/nuxt', '@peterbud/nuxt-query', '@vee-validate/nuxt'],
    appwrite: {
        endpoint: process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
        project: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID || '',
        locale: 'en'
    },
    routeRules: {
        '/**': { ssr: false }
    },
    devtools: {enabled: false},
    veeValidate: {
        // disable or enable auto imports
        autoImports: true,
      },
    shadcn: {
        prefix: 'Ui',
    },
    pinia: {
        storesDirs: ['./stores/**']
    },
    vite: {
        optimizeDeps: {
            include: ['json-bigint']
        }
    },
    nuxtQuery: {
        /**
         * Specify which Vue Query composables to auto-import
         * Default: `false`, set to `true` to auto-import all Vue Query composables
         */
        autoImports: ['useQuery', 'useMutation'],

        // Enable/disable Nuxt DevTools integration (default: true)
        devtools: true,

        /**
         * These are the same options as the QueryClient
         * from @tanstack/vue-query, which will be passed
         * to the QueryClient constructor
         * More details: https://tanstack.com/query/v5/docs/reference/QueryClient
         */

        queryClientOptions: {
            defaultOptions: {
                queries: {
                    // for example disable refetching on window focus
                    refetchOnWindowFocus: false,

                    // or change the default refetch interval
                    refetchInterval: 5000,
                },
            },
        },
    },
})