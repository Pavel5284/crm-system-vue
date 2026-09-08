// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    pages: true,
    srcDir: 'app',
    compatibilityDate: '2025-07-15',
    runtimeConfig: {
        public: {
            apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api'
        }
    },
     devServer: {
         port: 3001
     },
     nitro: {
         devProxy: {
             '/api/': {
                 target: 'http://localhost:3000/api',
                 changeOrigin: true,
             },
         },
     },
     components: [
         {
             path: '~/components',
             pattern: '**/*.vue',
             pathPrefix: true
         }
     ],
     fonts: false,
     css: ['~/assets/css/tailwind.css'],
    icon: {
        serverBundle: 'remote',
        localApiEndpoint: '/_nuxt_icon',
    },
    modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@nuxt/icon', ['@nuxtjs/google-fonts', {
        families: {
            Lato: {
                wght: [300, 400, 700],
                ital: [300],
            }
        }
    }], '@pinia/nuxt', '@peterbud/nuxt-query', '@vee-validate/nuxt', '@nuxtjs/i18n'],
    i18n: {
        locales: [
            { code: 'ru', name: 'RU', language: 'ru-RU', file: 'ru.json' },
            { code: 'en', name: 'EN', language: 'en-US', file: 'en.json' }
        ],
        defaultLocale: 'ru',
        strategy: 'no_prefix',
        langDir: 'locales',
        lazy: false,
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
            fallbackLocale: 'ru'
        },
        bundle: {
            optimizeTranslationDirective: false
        }
    },
    eslint: {
        config: {
            standalone: true
        }
    },
    routeRules: {
        '/**': { ssr: false }
    },
    devtools: {enabled: false},
    veeValidate: {
        autoImports: true,
    },
     pinia: {
         storesDirs: ['./stores']
     },
     vite: {
         optimizeDeps: {
             exclude: ['json-bigint']
         }
     },
     nuxtQuery: {
         autoImports: ['useQuery', 'useMutation'],
         devtools: false,
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

