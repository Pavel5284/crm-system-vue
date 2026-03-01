// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app',
  compatibilityDate: '2025-07-15',
   modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/image'],
  devtools: { enabled: false },
  shadcn:{
  prefix: '',
  componentDir: './components/ui',
  }
})