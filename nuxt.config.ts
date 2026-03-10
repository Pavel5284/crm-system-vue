// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    srcDir: 'app',
    compatibilityDate: '2025-07-15',
    runtimeConfig: {
        public: {
            appwriteEndpoint: process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
            appwriteProjectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID || '69a73a92003176567e1a'
        }
    },
    modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/image', '@nuxt/icon', ['@nuxtjs/google-fonts', {
        families: {
            Lato: {
                wght: [300, 400, 700],
                ital: [300],
            }
        }
    }], 'nuxt-appwrite', '@pinia/nuxt'],
    appwrite: {
        endpoint: 'https://fra.cloud.appwrite.io/v1',
        project: 'vue_crm',
        locale: 'en'
    },
    devtools: {enabled: false},
    shadcn: {
        prefix: 'Ui',
    },
    pinia: {
        storeDirs: ['./store/**']
    },
    vite: {
        optimizeDeps: {
            include: ['json-bigint']
        }
    }
})