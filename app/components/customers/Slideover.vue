<script lang="ts" setup>
import PhoneInput from '@crm/ui-kit/PhoneInput.vue'
import { isPhoneDisplayValid } from '@crm/ui-kit/phone'
import { getApiErrorMessage } from '~/utils/api'
import { deleteCustomerAvatarApi, updateCustomerApi, updateCustomerAvatarApi } from '~/utils/crm.api'

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

const nameRef = ref('')
const emailRef = ref('')
const phoneRef = ref('')
const contactPersonRef = ref('')
const avatarUrlRef = ref('')
const fromSourceRef = ref('')

watch(() => store.customer, (customer) => {
  if (!customer) return
  nameRef.value = customer.name
  emailRef.value = customer.email
  phoneRef.value = customer.phone ?? ''
  contactPersonRef.value = customer.contactPerson ?? ''
  avatarUrlRef.value = customer.avatarUrl || ''
  fromSourceRef.value = customer.fromSource ?? ''
}, { immediate: true })

const isSaving = ref(false)
const isAvatarSaving = ref(false)
const errorRef = ref('')

const phoneError = computed(() => {
  const value = phoneRef.value.trim()
  if (!value || isPhoneDisplayValid(value)) return ''
  return t('settings.profile.validation.phoneInvalid')
})

const isDirty = computed(() => {
  const c = store.customer
  if (!c) return false
  return nameRef.value !== c.name
    || emailRef.value !== c.email
    || (phoneRef.value || '') !== (c.phone ?? '')
    || (contactPersonRef.value || '') !== (c.contactPerson ?? '')
    || (fromSourceRef.value || '') !== (c.fromSource ?? '')
})

const customerInitials = computed(() => {
  const name = nameRef.value || store.customer?.name || ''
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
})

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

async function onSave() {
  if (!store.customer) return
  errorRef.value = ''
  isSaving.value = true
  try {
    const updated = await updateCustomerApi(store.customer.id, {
      name: nameRef.value,
      email: emailRef.value,
      phone: phoneRef.value || null,
      contactPerson: contactPersonRef.value || null,
      fromSource: fromSourceRef.value || null,
    })
    await props.refetch()
    // слайдовер НЕ закрываем: обновляем стор ответом, чтобы сбросить isDirty
    store.customer = updated
  } catch (e) {
    errorRef.value = getApiErrorMessage(e)
  } finally {
    isSaving.value = false
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
      <div class="mb-5 flex flex-col items-center gap-3">
        <UiAvatarUploader v-model="avatarUrlRef" :initials="customerInitials" :size="96" v-model:saving="isAvatarSaving" @upload="onCustomerAvatarUpload" @remove="onCustomerAvatarRemove" />
        <p class="text-xs text-muted-foreground">{{ t('avatar.hint') }}</p>
      </div>

      <div class="space-y-3">
        <UiInput :placeholder="t('customers.slideover.namePlaceholder')" type="text" class="input" v-model="nameRef"/>
        <UiInput placeholder="Email" type="email" class="input" v-model="emailRef"/>
        <PhoneInput v-model="phoneRef" :placeholder="t('settings.profile.phonePlaceholder')" :hint="t('settings.profile.phoneHint')" :error="phoneError"/>
        <UiInput :placeholder="t('customers.slideover.contactPersonPlaceholder')" type="text" class="input" v-model="contactPersonRef"/>
        <UiInput :placeholder="t('customers.slideover.sourcePlaceholder')" type="text" class="input" v-model="fromSourceRef"/>
      </div>

      <p v-if="errorRef" class="text-red-500 text-sm mt-3">{{ errorRef }}</p>

      <div class="flex items-center gap-3 mt-5">
        <UiButton type="button" :disabled="isSaving || !isDirty || !!phoneError" @click="onSave">
          {{ isSaving ? t('customers.slideover.saving') : t('customers.slideover.save') }}
        </UiButton>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.input {
  border: 1px solid #161c26;
}
.input::placeholder {
  color: #748092;
}
</style>

