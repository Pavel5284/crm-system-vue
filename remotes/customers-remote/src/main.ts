import { createApp } from 'vue'
import CustomersPage from './CustomersPage.vue'

// Standalone-playground для независимой разработки remote:
// `pnpm --filter @crm/customers-remote dev` — host не нужен.
createApp(CustomersPage, {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://crm-api-gateway-zyrg.onrender.com/api',
  locale: 'ru',
}).mount('#app')
