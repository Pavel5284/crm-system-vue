// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app',
  compatibilityDate: '2025-07-15',
  ssr: true,
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: { lang: 'ru' },
      titleTemplate: '%s | CRM System',
    },
  },
  devServer: { port: 3001 },
  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    minify: true,
  },
  routeRules: {
    '/login': { ssr: false },
    '/register': { ssr: false },
    '/verify-email': { ssr: false },
    '/ws-test': { ssr: false },
    '/**': {
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },
  components: [{ path: '~/components', pattern: '**/*.vue', pathPrefix: true }],
  fonts: false,
  css: ['~/assets/css/tailwind.css'],
  icon: { serverBundle: 'remote', localApiEndpoint: '/_nuxt_icon' },
  modules: ['@nuxt/eslint','@nuxt/ui','@nuxt/image','@nuxt/icon',['@nuxtjs/google-fonts',{families:{Lato:{wght:[300,400,700],ital:[300]}}}],'@pinia/nuxt','@peterbud/nuxt-query','@vee-validate/nuxt','@nuxtjs/i18n'],
  i18n: {
    locales: [{ code: 'ru', name: 'RU', language: 'ru-RU', file: 'ru.json' },{ code: 'en', name: 'EN', language: 'en-US', file: 'en.json' }],
    defaultLocale: 'ru', strategy: 'no_prefix', langDir: 'locales', lazy: true,
    detectBrowserLanguage: { useCookie:true, cookieKey:'i18n_redirected', redirectOn:'root', fallbackLocale:'ru' },
    bundle: { optimizeTranslationDirective:false },
  },
  eslint: { config: { standalone: true } },
  devtools: { enabled:false },
  typescript: { strict:true, typeCheck:false },
  experimental: { typedPages:true, payloadExtraction:true },
  veeValidate: { autoImports:true, typedSchemaPackage:'none' },
  pinia: { storesDirs:['./stores'] },
  vite: { optimizeDeps:{ exclude:['json-bigint'] } },
  nuxtQuery: {
    autoImports:['useQuery','useMutation'], devtools:false,
    queryClientOptions:{ defaultOptions:{ queries:{ refetchOnWindowFocus:false, refetchOnReconnect:true, refetchInterval:false as unknown as number, staleTime:30_000, retry:1 } } },
  },
})
