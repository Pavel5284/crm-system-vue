<script lang="ts" setup>
import type { ICustomer } from "~/types/deals.types";
import { COLLECTION_CUSTOMERS, useDbId } from "~/app.constants"
import { getDb } from "~/utils/appwite"

useSeoMeta({
  title: 'Customers | CRM System'
})

const DB_ID = useDbId()
const DB = getDb()

const {data, isLoading} = useQuery({
  queryKey: ['customers'],
  queryFn: () => DB.listDocuments(DB_ID, COLLECTION_CUSTOMERS),
  refetchInterval: false
})

const customers = computed(() => (data.value?.documents as unknown as ICustomer[]) ?? [])
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
        :key="customer.$id"
        >
          <UiTableCell>
            <NuxtLink :href="`/customers/edit/${customer.$id}`">
              <NuxtImg
              :src="customer.avatar_url"
              :alt="customer.name"
              width="50"
              height="50"
              class="rounded-full"
              />
            </NuxtLink>
          </UiTableCell>
          <UiTableCell class="font-medium">{{customer.name}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.email}}</UiTableCell>
          <UiTableCell class="font-medium">{{customer.from_source}}</UiTableCell>

        </UiTableRow>
      </UiTableBody>
    </UiTable>
  </div>
</template>