<script setup lang="ts">
import PhoneInput from '@crm/ui-kit/PhoneInput.vue'
import { isPhoneDisplayValid } from '@crm/ui-kit/phone'
import type { CreateDealPayload } from "~/types/backend.contracts";
import {createDealApi, getCustomersApi} from "~/utils/crm.api"
import { getApiErrorMessage } from '~/utils/api'

const { t } = useI18n()
const isOpenForm = ref<boolean>(false);
const authStore = useAuthStore()

const props = defineProps<{
  refetch: () => void
}>()

interface IDealFormState {
  name: string
  price: number
  description: string
}

const {handleSubmit, defineField, handleReset} = useForm<IDealFormState>()

const [name, nameAttrs] = defineField('name')
const [description, descriptionAttrs] = defineField('description')
const [price, priceAttrs] = defineField('price')

// Клиент сделки: выбор существующего (combobox) или создание нового.
const customerMode = ref<'select' | 'new'>('select')
const { data: customersData } = useQuery({
  queryKey: ['customers'],
  queryFn: () => getCustomersApi(),
  refetchInterval: false,
  enabled: computed(() => authStore.isAuth && isOpenForm.value),
})
const customers = computed(() => customersData.value ?? [])

const customerSearch = ref('')
const selectedCustomerId = ref('')
const isCustomerDropdownOpen = ref(false)
const customerComboboxRef = ref<HTMLElement | null>(null)
const filteredCustomers = computed(() => {
  const q = customerSearch.value.trim().toLowerCase()
  if (!q) return customers.value
  return customers.value.filter((c) =>
    c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  )
})
const selectedCustomer = computed(() =>
  customers.value.find((c) => c.id === selectedCustomerId.value),
)

function selectCustomer(c: { id: string; name: string }) {
  selectedCustomerId.value = c.id
  customerSearch.value = c.name
  isCustomerDropdownOpen.value = false
}

function onCustomerInput() {
  isCustomerDropdownOpen.value = true
  if (selectedCustomer.value && selectedCustomer.value.name !== customerSearch.value) {
    selectedCustomerId.value = ''
  }
}

function clearSelectedCustomer() {
  selectedCustomerId.value = ''
  customerSearch.value = ''
  isCustomerDropdownOpen.value = true
}

function onCustomerClickOutside(e: MouseEvent) {
  if (customerComboboxRef.value && !customerComboboxRef.value.contains(e.target as Node)) {
    isCustomerDropdownOpen.value = false
    // Если текст не соответствует выбранному — сбрасываем выбор
    if (selectedCustomer.value && selectedCustomer.value.name !== customerSearch.value) {
      // оставляем текст как фильтр, но выбор уже сброшен в onCustomerInput
    }
  }
}

onMounted(() => document.addEventListener('click', onCustomerClickOutside))
onUnmounted(() => document.removeEventListener('click', onCustomerClickOutside))

const newName = ref('')
const newEmail = ref('')
const newPhone = ref('')
const newContact = ref('')
const newSource = ref('')

const submitError = ref('')

const isCustomerValid = computed(() => {
  if (customerMode.value === 'select') return selectedCustomerId.value !== ''
  if (newPhone.value.trim() && !isPhoneDisplayValid(newPhone.value.trim())) return false
  return newName.value.trim() !== '' && newEmail.value.trim() !== ''
})

const newPhoneError = computed(() => {
  const value = newPhone.value.trim()
  if (!value || isPhoneDisplayValid(value)) return ''
  return t('settings.profile.validation.phoneInvalid')
})

const {mutate, isPending} = useMutation({
  mutationKey: ['create a new deal'],
  mutationFn: async (data: IDealFormState) => {
    const payload: CreateDealPayload = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      // Этап 5: ответственный обязателен — по умолчанию создатель сделки.
      responsibleUserId: authStore.user.id,
    }
    if (customerMode.value === 'select') {
      payload.customerId = selectedCustomerId.value
    } else {
      payload.newCustomer = {
        name: newName.value.trim(),
        email: newEmail.value.trim(),
        ...(newPhone.value.trim() ? { phone: newPhone.value.trim() } : {}),
        ...(newContact.value.trim() ? { contactPerson: newContact.value.trim() } : {}),
        ...(newSource.value.trim() ? { fromSource: newSource.value.trim() } : {}),
      }
    }
    return createDealApi(payload)
  },
  onSuccess() {
    props.refetch()
    handleReset()
    customerSearch.value = ''
    selectedCustomerId.value = ''
    isCustomerDropdownOpen.value = false
    newName.value = ''
    newEmail.value = ''
    newPhone.value = ''
    newContact.value = ''
    newSource.value = ''
    submitError.value = ''
  },
  onError(e) {
    submitError.value = getApiErrorMessage(e)
  },
})
const onSubmit = handleSubmit(values => {
  submitError.value = ''
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
    <div class="mode-switch">
      <button
        type="button"
        :class="{ active: customerMode === 'select' }"
        @click="customerMode = 'select'"
      >
        {{ t('kanban.createDeal.existingCustomer') }}
      </button>
      <button
        type="button"
        :class="{ active: customerMode === 'new' }"
        @click="customerMode = 'new'"
      >
        {{ t('kanban.createDeal.newCustomer') }}
      </button>
    </div>
    <template v-if="customerMode === 'select'">
      <div ref="customerComboboxRef" class="combobox">
        <UiInput
          :placeholder="t('kanban.createDeal.customerSearchPlaceholder')"
          v-model="customerSearch"
          type="text"
          class="input"
          autocomplete="off"
          @focus="isCustomerDropdownOpen = true"
          @click="isCustomerDropdownOpen = true"
          @input="onCustomerInput"
          @keydown.escape="isCustomerDropdownOpen = false"
          @keydown.down.prevent="isCustomerDropdownOpen = true"
        />
        <button
          v-if="customerSearch || selectedCustomerId"
          type="button"
          class="combobox-clear"
          @click="clearSelectedCustomer"
          aria-label="clear"
        >
          ✕
        </button>
        <ul v-if="isCustomerDropdownOpen" class="dropdown">
          <li
            v-for="c in filteredCustomers"
            :key="c.id"
            class="dropdown-item"
            :class="{ selected: c.id === selectedCustomerId }"
            @mousedown.prevent="selectCustomer(c)"
          >
            <span class="dropdown-name">{{ c.name }}</span>
            <span class="dropdown-email">{{ c.email }}</span>
          </li>
          <li v-if="!filteredCustomers.length" class="dropdown-empty">
            {{ t('common.noData') }}
          </li>
        </ul>
      </div>
    </template>
    <template v-else>
      <UiInput
        :placeholder="t('kanban.createDeal.companyPlaceholder')"
        v-model="newName"
        type="text"
        required
        class="input"
      />
      <UiInput
        placeholder="Email"
        v-model="newEmail"
        type="email"
        required
        class="input"
      />
      <div class="mb-2">
        <PhoneInput
          v-model="newPhone"
          :placeholder="t('settings.profile.phonePlaceholder')"
          :hint="t('settings.profile.phoneHint')"
          :error="newPhoneError"
        />
      </div>
      <UiInput
        :placeholder="t('kanban.createDeal.customerNamePlaceholder')"
        v-model="newContact"
        type="text"
        class="input"
      />
      <UiInput
        :placeholder="t('kanban.createDeal.sourcePlaceholder')"
        v-model="newSource"
        type="text"
        class="input"
      />
    </template>
    <p v-if="submitError" class="error">{{ submitError }}</p>
    <button class="btn" :disabled="isPending || !isCustomerValid">
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
.combobox {
  position: relative;
  margin-bottom: 0.5rem;
}
.combobox :deep(.input) {
  margin-bottom: 0;
}
.combobox-clear {
  position: absolute;
  right: 0.5rem;
  top: 0.45rem;
  font-size: 0.7rem;
  color: #748092;
  line-height: 1;
}
.combobox-clear:hover {
  color: white;
}
.dropdown {
  position: absolute;
  z-index: 30;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  max-height: 12rem;
  overflow-y: auto;
  background: #161c26;
  border: 1px solid #2a3342;
  border-radius: 0.375rem;
  padding: 0.25rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}
.dropdown-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0.4rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  text-align: left;
}
.dropdown-item:hover {
  background: #222c3d;
}
.dropdown-item.selected {
  background: #2c2140;
  outline: 1px solid #a252c8;
}
.dropdown-name {
  font-size: 0.8rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-email {
  font-size: 0.7rem;
  color: #748092;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-empty {
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #748092;
  text-align: center;
}

.mode-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.mode-switch button {
  flex: 1;
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.mode-switch button.active {
  border-color: #a252c8;
  color: white;
}

.error {
  font-size: 0.75rem;
  color: #e5a3a3;
  margin-bottom: 0.5rem;
}

.btn {
  font-size: 0.75rem;
  border: 1px solid #161c26;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #aebed5;
  transition: border-color 0.2s, color 0.2s;
}
.btn:hover:not(:disabled) {
  border-color: #482c65;
  color: white;
}
.btn:disabled {
  opacity: 0.5;
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
