import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { federation } from '@module-federation/vite'
import { defineConfig } from 'vite'

// Remote живёт только на клиенте (вариант B): никакого SSR.
// Чанки должны резолвиться рядом с remoteEntry.js (версионированный
// префикс /vX.Y.Z/ на VPS или immutable deployment-URL на Vercel),
// поэтому base относительный.
export default defineConfig({
  server: {
    port: 4174,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:4174',
  },
  preview: {
    port: 4174,
    strictPort: true,
    cors: true,
  },
  base: './',
  build: {
    target: 'chrome89',
    modulePreload: false,
    cssCodeSplit: false,
    minify: true,
  },
  plugins: [
    vue(),
    // Та же тема, что в host (@crm/ui-theme): иначе классы разъедутся.
    tailwindcss(),
    federation({
      name: 'customers',
      filename: 'remoteEntry.js',
      exposes: {
        './CustomersPage': './src/CustomersPage.vue',
      },
      shared: {
        // Правило №1: vue — singleton и та же мажор/минор-версия, что в host.
        // Рассинхрон = два инстанса Vue и странные баги реактивности.
        vue: { singleton: true, requiredVersion: '^3.5.0' },
      },
    }),
  ],
})
