<script setup lang="ts">
import type {IDeal} from "~/types/deals.types";
import {getDb, ID} from "~/utils/appwite"
import {useDbId, COLLECTION_DEALS} from "~/app.constants"
import {toRef} from "vue"

const isOpenForm = ref<boolean>(false);
const DB_ID = useDbId()

const props = defineProps<{
  status: string
  refetch: () => void
}>()

interface IDealFormState extends Pick<IDeal, 'name' | "price"> {
  customer: {
    email: string;
    name: string;
  }
  status: string;
}

const {handleSubmit, defineField, handleReset} = useForm<IDealFormState>({
  initialValues: {
    status: toRef(props, 'status').value,
  }
})

const [name, nameAttrs] = defineField('name')
const [price, priceAttrs] = defineField('price')
const [customerEmail, customerEmailAttrs] = defineField('customer.email')
const [customerName, customerNamelAttrs] = defineField('customer.name')

const {mutate, isPending} = useMutation({
  mutationKey: ['create a new deal'],
  mutationFn: async (data: IDealFormState) => {
    const DB = getDb()
    return DB.createDocument(DB_ID, COLLECTION_DEALS, ID.unique(), {
      ...data,
      price: Number(data.price)
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
        class="transition-all opacity-5 hover:opacity-100 hover:text-[#a252c8]"
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
      placeholder="Наименование"
      v-model="name"
      v-bind="nameAttrs"
      type="text"
      class="input"
    />
    <UiInput
      placeholder="Сумма"
      v-model="price"
      v-bind="priceAttrs"
      type="text"
      class="input"
    />
    <UiInput
      placeholder="Email"
      v-model="customerEmail"
      v-bind="customerEmailAttrs"
      type="text"
      class="input"
    />
    <UiInput
      placeholder="Компания"
      v-model="customerName"
      v-bind="customerNamelAttrs"
      type="text"
      class="input"
    />
    <button class="btn" :disabled="isPending">
      {{isPending ? 'Загрузка...' : 'Добавить'}}
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