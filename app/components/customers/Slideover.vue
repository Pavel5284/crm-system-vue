<script lang="ts" setup>
import CustomerForm from '@crm/customer-form/CustomerForm.vue'
import { CUSTOMER_FORM_LIMITS, type CustomerFormLabels } from '@crm/customer-form/types'
import { getApiErrorMessage } from '~/utils/api'
import { deleteCustomerAvatarApi, updateCustomerApi, updateCustomerAvatarApi } from '~/utils/crm.api'
import type { UpdateCustomerPayload } from '~/types/backend.contracts'

const { t } = useI18n()

const props = defineProps<{
  refetch: () => Promise<unknown>
}>()

const store = useCustomerSlideStore()

const isLocalOpen = computed({
  get: () => store.isOpen,
  set: value => {
    store.isOpen = value
  }
})

// Все строки формы — из host-i18n (лимиты — из пакета, ими же
// интерполируем сообщения валидации).
const labels = computed<CustomerFormLabels>(() => ({
  nameLabel: t('customers.slideover.namePlaceholder'),
  namePlaceholder: t('customers.slideover.namePlaceholder'),
  emailLabel: t('customers.slideover.emailPlaceholder'),
  emailPlaceholder: t('customers.slideover.emailPlaceholder'),
  phoneLabel: t('customers.slideover.phonePlaceholder'),
  phonePlaceholder: t('settings.profile.phonePlaceholder'),
  phoneHint: t('settings.profile.phoneHint'),
  contactLabel: t('customers.slideover.contactPersonPlaceholder'),
  contactPlaceholder: t('customers.slideover.contactPersonPlaceholder'),
  sourceLabel: t('customers.slideover.sourcePlaceholder'),
  sourcePlaceholder: t('customers.slideover.sourcePlaceholder'),
  avatarHint: t('avatar.hint'),
  save: t('customers.slideover.save'),
  saving: t('customers.slideover.saving'),
  nameRequired: t('validation.nameRequired'),
  nameTooLong: t('validation.nameTooLong'),
  nameInvalid: t('validation.nameInvalid'),
  emailTooLong: t('validation.emailTooLong'),
  emailInvalid: t('validation.emailInvalid'),
  phoneInvalid: t('settings.profile.validation.phoneInvalid'),
  textTooLong: t('validation.textTooLong', { max: CUSTOMER_FORM_LIMITS.textMaxLength }),
  textInvalid: t('validation.invalidCharacters'),
}))

const avatarLabels = computed(() => ({
  upload: t('avatar.upload'),
  remove: t('avatar.remove'),
  fileTooLarge: t('avatar.fileTooLarge'),
  onlyImage: t('avatar.onlyImage'),
  readError: t('avatar.readError'),
}))

const avatarUrlRef = ref('')

watch(() => store.customer, (customer) => {
  avatarUrlRef.value = customer?.avatarUrl || ''
}, { immediate: true })

const isSaving = ref(false)
const isAvatarSaving = ref(false)
const errorRef = ref('')

// Сюда попадаем только при валидной форме (проверка — внутри пакета).
async function onSave(payload: UpdateCustomerPayload) {
  if (!store.customer) return
  errorRef.value = ''
  isSaving.value = true
  try {
    const updated = await updateCustomerApi(store.customer.id, payload)
    await props.refetch()
    // слайдовер НЕ закрываем: обновляем стор ответом
    store.customer = updated
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isSaving.value = false
  }
}

async function onCustomerAvatarUpload(dataUrl: string) {
  if (!store.customer) return
  isAvatarSaving.value = true
  errorRef.value = ''
  try {
    await updateCustomerAvatarApi(store.customer.id, dataUrl)
    avatarUrlRef.value = dataUrl
    await props.refetch()
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
    avatarUrlRef.value = store.customer.avatarUrl || ''
  } finally {
    isAvatarSaving.value = false
  }
}

async function onCustomerAvatarRemove() {
  if (!store.customer) return
  isAvatarSaving.value = true
  errorRef.value = ''
  try {
    await deleteCustomerAvatarApi(store.customer.id)
    avatarUrlRef.value = ''
    await props.refetch()
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isAvatarSaving.value = false
  }
}
</script>

<template>
  <USlideover
    v-model:open="isLocalOpen"
    side="right"
    :title="t('customers.slideover.title')"
    :description="t('customers.slideover.description')"
  >
    <template #body>
      <CustomerForm
        :customer="store.customer"
        :labels="labels"
        :avatar-labels="avatarLabels"
        :avatar-url="avatarUrlRef"
        :avatar-saving="isAvatarSaving"
        :saving="isSaving"
        :server-error="errorRef"
        @save="onSave"
        @upload-avatar="onCustomerAvatarUpload"
        @remove-avatar="onCustomerAvatarRemove"
      >
        <template #avatar-icon="{ saving }">
          <Icon :name="saving ? 'lucide:loader-2' : 'lucide:camera'" size="16" :class="saving && 'animate-spin'" />
        </template>
      </CustomerForm>
    </template>
  </USlideover>
</template>
