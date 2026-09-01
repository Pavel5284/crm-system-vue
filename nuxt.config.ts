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
    modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/icon', ['@nuxtjs/google-fonts', {
        families: {
            Lato: {
                wght: [300, 400, 700],
                ital: [300],
            }
        }
    }], '@pinia/nuxt', '@peterbud/nuxt-query', '@vee-validate/nuxt'],
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