<script lang="ts" setup>
import type { ICustomer } from "~/types/deals.types"
import { getCustomersApi } from "~/utils/crm.api"

useSeoMeta({
  title: 'Customers | CRM System'
})

const store = useCustomerSlideStore()
const authStore = useAuthStore()

const {data, isLoading, refetch} = useQuery({
  queryKey: ['customers'],
  queryFn: () => getCustomersApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth),
})

const customers = computed(() => (data.value as ICustomer[]) ?? [])
</script>


<template>
  <div>
    <h1 class="font-bold text-2x1 mb-10">Наши клиенты</h1>
    <div v-if="isLoading">Loading...</div>
    <UiTable v-else>
      <UiTableHeader>
        <UiTableRow>
          <UiTableHead class="w-[80px]">Изображение</UiTableHead>
          <UiTableHead class="w-[200px]">Наименование</UiTableHead>
          <UiTableHead class="w-[200px]">Email</UiTableHead>
          <UiTableHead>Откуда пришёл</UiTableHead>
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
          <UiTableCell class="font-medium">{{customer.fromSource}}</UiTableCell>

        </UiTableRow>
      </UiTableBody>
    </UiTable>

    <CustomersSlideover :refetch="refetch"/>
  </div>
</template>
