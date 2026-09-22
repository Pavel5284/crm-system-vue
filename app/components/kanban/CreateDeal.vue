<script setup lang="ts">
import type { DealDto } from "~/types/backend.contracts";
import {createDealApi} from "~/utils/crm.api"

const { t } = useI18n()
const isOpenForm = ref<boolean>(false);
const authStore = useAuthStore()

const props = defineProps<{
  refetch: () => void
}>()

interface IDealFormState extends Pick<DealDto, 'name' | "price" | "company" | "description"> {
  customer: {
    email: string;
    name: string;
  }
}

const {handleSubmit, defineField, handleReset} = useForm<IDealFormState>()

const [name, nameAttrs] = defineField('name')
const [company, companyAttrs] = defineField('company')
const [description, descriptionAttrs] = defineField('description')
const [price, priceAttrs] = defineField('price')
const [customerEmail, customerEmailAttrs] = defineField('customer.email')
const [customerName, customerNamelAttrs] = defineField('customer.name')

const {mutate, isPending} = useMutation({
  mutationKey: ['create a new deal'],
  mutationFn: async (data: IDealFormState) => {
    return createDealApi({
      name: data.name,
      company: data.company,
      description: data.description,
      price: Number(data.price),
      customerEmail: data.customer.email,
      customerName: data.customer.name,
      // Этап 5: ответственный обязателен — по умолчанию создатель сделки.
      responsibleUserId: authStore.user.id,
    })
  },
  onSuccess() {
    props.refetch()
    handleReset()
  }
})
const onSubmit = handleSubmit(values => {
  mutate(values)
})
</script>

<template>
  <div class="text-center mb-2">
    <button
        class="transition-all text-[#a252c8] opacity-80 hover:opacity-100"
        @click="isOpenForm = !isOpenForm"
    >
      <Icon
          v-if="isOpenForm"
          name="line-md:arrow-up"
          class="fade-in-100 fade-out-0"
          size="35"
      />
      <Icon
          v-else
          name="line-md:plus"
          class="fade-in-100 fade-out-0"
          size="35"
      />

    </button>
  </div>
  <form v-if="isOpenForm" @submit="onSubmit" class="form">
    <UiInput
      :placeholder="t('kanban.createDeal.namePlaceholder')"
      v-model="name"
      v-bind="nameAttrs"
      type="text"
      required
      minlength="2"
      class="input"
    />
    <UiInput
      :placeholder="t('kanban.createDeal.companyPlaceholder')"
      v-model="company"
      v-bind="companyAttrs"
      type="text"
      required
      minlength="2"
      class="input"
    />
    <UiInput
      :placeholder="t('kanban.createDeal.descriptionPlaceholder')"
      v-model="description"
      v-bind="descriptionAttrs"
      type="text"
      required
      minlength="10"
      class="input"
    />
    <UiInput
      :placeholder="t('kanban.createDeal.pricePlaceholder')"
      v-model="price"
      v-bind="priceAttrs"
      type="text"
      required
      class="input"
    />
    <UiInput
      placeholder="Email"
      v-model="customerEmail"
      v-bind="customerEmailAttrs"
      type="text"
      required
      class="input"
    />
    <UiInput
      :placeholder="t('kanban.createDeal.companyPlaceholder')"
      v-model="customerName"
      v-bind="customerNamelAttrs"
      type="text"
      required
      class="input"
    />
    <button class="btn" :disabled="isPending">
      {{isPending ? t('kanban.createDeal.adding') : t('kanban.createDeal.addButton')}}
    </button>
  </form>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
  margin-bottom: 0.5rem;
}
.input::placeholder {
  color: #748092;
}
.input:focus {
  border-color: #a252c8;
  transition: border-color 0.2s;
}

.btn {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.btn:hover {
  border-color: #482c65;
  color: white;
}

.form {
  margin-bottom: 0.75rem;
  display: block;
  animation: show 0.3s ease-in-out;
}

@keyframes show {
  from {
    border-color: #a252c83d;
    transform: translateY(-35px);
    opacity: 0.4;
  }
  90% {
    border-color: #a252c83d;
  }
  to {
    border-color: transparent;
    transform: translateY(0);
    opacity: 1;
  }
}
</style>

