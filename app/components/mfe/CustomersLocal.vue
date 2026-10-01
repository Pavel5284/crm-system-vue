<script lang="ts" setup>
import CustomerTable from '@crm/customer-form/CustomerTable.vue'
import type { CustomerTableLabels } from '@crm/customer-form/types'
import { getCustomersApi } from "~/utils/crm.api"

const { t } = useI18n()

useSeoMeta({
  title: t('customers.seoTitle')
})

const store = useCustomerSlideStore()
const authStore = useAuthStore()

const {data, isLoading, refetch} = useQuery({
  queryKey: ['customers'],
  queryFn: () => getCustomersApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth),
})

const customers = computed(() => data.value ?? [])

// Подписи таблицы — из host-i18n. Колонки — объединение обоих вариантов:
// контактного лица в host-таблице не было, хотя данные уже загружены.
const tableLabels = computed<CustomerTableLabels>(() => ({
  listTitle: t('customers.listTitle'),
  loading: t('customers.loading'),
  empty: t('common.noData'),
  avatarCol: t('customers.table.avatar'),
  nameCol: t('customers.table.name'),
  emailCol: t('customers.table.email'),
  phoneCol: t('customers.table.phone'),
  contactCol: t('customers.slideover.contactPersonPlaceholder'),
  sourceCol: t('customers.table.source'),
  dealsCol: t('customers.table.dealsCount'),
}))
</script>


<template>
  <div>
    <CustomerTable
      :customers="customers"
      :labels="tableLabels"
      :loading="isLoading"
      @select="store.set"
    >
      <template #avatar-fallback>
        <Icon name="lucide:user" size="22" class="text-slate-500" />
      </template>
    </CustomerTable>

    <CustomersSlideover :refetch="refetch"/>
  </div>
</template>
