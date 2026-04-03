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
    css: ['~/assets/css/tailwind.css'],
    modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/icon', ['@nuxtjs/google-fonts', {
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
        autoImports: true,
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
        autoImports: ['useQuery', 'useMutation'],
        devtools: true,
        queryClientOptions: {
            defaultOptions: {
                queries: {
                    refetchOnWindowFocus: false,
                    refetchInterval: 5000,
                },
            },
        },
    },
})