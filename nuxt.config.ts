// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    srcDir: 'app',
    compatibilityDate: '2025-07-15',
    modules: [
        '@nuxtjs/tailwindcss',
        'shadcn-nuxt',
        '@nuxt/image',
        '@nuxt/icon',
        ['@nuxtjs/google-fonts', {
            families: {
                Lato: {
                    wght: [300, 400, 700],
                    ital: [300],
                }
            }
        }],
    ],
    devtools: {enabled: false},
    shadcn: {
        prefix: 'Ui',
    }
})
