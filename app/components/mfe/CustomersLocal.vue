<script lang="ts" setup>
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
</script>


<template>
  <div>
    <h1 class="font-bold text-2x1 mb-10">{{ t('customers.listTitle') }}</h1>
    <div v-if="isLoading">{{ t('customers.loading') }}</div>
    <UiTable v-else>
      <UiTableHeader>
        <UiTableRow>
          <UiTableHead class="w-[80px]">{{ t('customers.table.avatar') }}</UiTableHead>
          <UiTableHead class="w-[200px]">{{ t('customers.table.name') }}</UiTableHead>
          <UiTableHead class="w-[200px]">Email</UiTableHead>
          <UiTableHead>{{ t('customers.table.phone') }}</UiTableHead>
          <UiTableHead>{{ t('customers.table.source') }}</UiTableHead>
          <UiTableHead>{{ t('customers.table.dealsCount') }}</UiTableHead>
        </UiTableRow>
      </UiTableHeader>
      <UiTableBody>
        <UiTableRow
        v-for="customer in customers"
        :key="customer.id"
        class="cursor-pointer hover:bg-white/5 transition-colors"
        @click="store.set(customer)"
        >
          <UiTableCell>
            <img
                v-if="customer.avatarUrl"
                :src="customer.avatarUrl"
                :alt="customer.name"
                width="50"
                height="50"
                class="w-[50px] h-[50px] rounded-full object-cover shrink-0"
            />
            <div
                v-else
                class="w-[50px] h-[50px] rounded-full bg-[#1a2332] border border-[#161c26] flex items-center justify-center shrink-0"
            >
              <Icon name="lucide:user" size="22" class="text-slate-500" />
            </div>
          </UiTableCell>
          <UiTableCell class="font-medium">{{customer.name}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.email}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.phone ?? '—'}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.fromSource}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.dealsCount ?? '—'}}</UiTableCell>

        </UiTableRow>
      </UiTableBody>
    </UiTable>

    <CustomersSlideover :refetch="refetch"/>
  </div>
</template>
