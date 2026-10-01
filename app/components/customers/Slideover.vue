<script lang="ts" setup>
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import PhoneInput from '@crm/ui-kit/PhoneInput.vue'
import AvatarUploader from '@crm/ui-kit/AvatarUploader.vue'
import { getInitials } from '@crm/ui-kit/avatar'
import { getApiErrorMessage } from '~/utils/api'
import { CUSTOMER_TEXT_MAX_LENGTH } from '~/utils/validation'
import { createPhoneSchema } from '~/schemas/phone.schema'
import { createOptionalTextSchema } from '~/schemas/optional-text.schema'
import { formatFieldErrors } from '~/utils/form-errors'
import { deleteCustomerAvatarApi, updateCustomerApi, updateCustomerAvatarApi } from '~/utils/crm.api'
import type { CustomerDto } from '~/types/backend.contracts'

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

interface CustomerFormValues {
  name: string
  email: string
  phone: string
  contactPerson: string
  fromSource: string
}

const emptyValues: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  contactPerson: '',
  fromSource: '',
}

const toFormValues = (c: CustomerDto): CustomerFormValues => ({
  name: c.name,
  email: c.email,
  phone: c.phone ?? '',
  contactPerson: c.contactPerson ?? '',
  fromSource: c.fromSource ?? '',
})

// Валидация при каждом вводе (onChange) + повторный прогон на сабмите:
// сюда попадаем только при валидной форме.
const form = useTanStackForm({
  defaultValues: { ...emptyValues },
  onSubmit: async ({ value }) => {
    if (!store.customer) return
    errorRef.value = ''
    try {
      const updated = await updateCustomerApi(store.customer.id, {
        name: value.name.trim(),
        email: value.email.trim(),
        phone: value.phone.trim() || null,
        contactPerson: value.contactPerson.trim() || null,
        fromSource: value.fromSource.trim() || null,
      })
      await props.refetch()
      // слайдовер НЕ закрываем: обновляем стор ответом и сбрасываем
      // dirty актуальными значениями (сторож ниже тоже сделает reset).
      store.customer = updated
      form.reset(toFormValues(updated))
    }
    catch (e) {
      errorRef.value = getApiErrorMessage(e)
    }
  },
})

const CustomerField = form.Field
const formValues = form.useStore((state) => state.values)
const isDirty = form.useStore((state) => state.isDirty)
const canSubmit = form.useStore((state) => state.canSubmit)
const isSubmitting = form.useStore((state) => state.isSubmitting)

// Правила сырых полей (телефон/тексты) — зеркало backend UpdateCustomerDto.
// Имя и email валидируются внутри готовых FormNameField/FormEmailField
// (email — :required="false": пустое значение валидно, в отличие от auth).
const phoneSchema = createPhoneSchema(t)
const customerTextSchema = createOptionalTextSchema(t, { maxLength: CUSTOMER_TEXT_MAX_LENGTH })

// Текст ошибки под сырым полем (у готовых Form* inside — свой resolveError).
const resolveError = (errors: unknown[]): string | undefined =>
  errors.length ? formatFieldErrors(errors) : undefined

watch(() => store.customer, (customer) => {
  if (!customer) return
  avatarUrlRef.value = customer.avatarUrl || ''
  form.reset(toFormValues(customer))
}, { immediate: true })

const avatarUrlRef = ref('')

const isAvatarSaving = ref(false)
const errorRef = ref('')

const customerInitials = computed(() =>
  getInitials(formValues.value.name || store.customer?.name || ''),
)

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
      <div class="mb-5 flex flex-col items-center gap-3">
        <AvatarUploader
          v-model="avatarUrlRef"
          :initials="customerInitials"
          :size="96"
          v-model:saving="isAvatarSaving"
          :labels="{
            upload: t('avatar.upload'),
            remove: t('avatar.remove'),
            fileTooLarge: t('avatar.fileTooLarge'),
            onlyImage: t('avatar.onlyImage'),
            readError: t('avatar.readError'),
          }"
          @upload="onCustomerAvatarUpload"
          @remove="onCustomerAvatarRemove"
        >
          <template #icon="{ saving }">
            <Icon :name="saving ? 'lucide:loader-2' : 'lucide:camera'" size="16" :class="saving && 'animate-spin'" />
          </template>
        </AvatarUploader>
        <p class="text-xs text-muted-foreground">{{ t('avatar.hint') }}</p>
      </div>

      <form autocomplete="on" @submit.prevent="() => form.handleSubmit()">
        <div class="field">
          <label class="label">{{ t('customers.slideover.namePlaceholder') }}</label>
          <FormNameField
            :form="form"
            :max-length="CUSTOMER_TEXT_MAX_LENGTH"
            :placeholder="t('customers.slideover.namePlaceholder')"
          />
        </div>
        <div class="field">
          <label class="label">{{ t('customers.slideover.emailPlaceholder') }}</label>
          <FormEmailField
            :form="form"
            :required="false"
            :placeholder="t('customers.slideover.emailPlaceholder')"
          />
        </div>
        <div class="field">
          <label class="label">{{ t('customers.slideover.phonePlaceholder') }}</label>
          <CustomerField name="phone" :validators="{ onChange: phoneSchema }" v-slot="{ field }">
            <PhoneInput
              :modelValue="field.state.value as string"
              :placeholder="t('settings.profile.phonePlaceholder')"
              :hint="t('settings.profile.phoneHint')"
              :error="resolveError(field.state.meta.errors) ?? ''"
              @update:modelValue="(val: string) => field.handleChange(val)"
              @blur="field.handleBlur"
            />
          </CustomerField>
        </div>
        <div class="field">
          <label class="label">{{ t('customers.slideover.contactPersonPlaceholder') }}</label>
          <CustomerField name="contactPerson" :validators="{ onChange: customerTextSchema }" v-slot="{ field }">
            <UiInput
              :modelValue="field.state.value as string"
              :placeholder="t('customers.slideover.contactPersonPlaceholder')"
              type="text"
              class="input"
              :error="resolveError(field.state.meta.errors)"
              @update:modelValue="(val: string | number) => field.handleChange(val as string)"
              @blur="field.handleBlur"
            />
          </CustomerField>
        </div>
        <div class="field">
          <label class="label">{{ t('customers.slideover.sourcePlaceholder') }}</label>
          <CustomerField name="fromSource" :validators="{ onChange: customerTextSchema }" v-slot="{ field }">
            <UiInput
              :modelValue="field.state.value as string"
              :placeholder="t('customers.slideover.sourcePlaceholder')"
              type="text"
              class="input"
              :error="resolveError(field.state.meta.errors)"
              @update:modelValue="(val: string | number) => field.handleChange(val as string)"
              @blur="field.handleBlur"
            />
          </CustomerField>
        </div>

        <p v-if="errorRef" class="text-red-500 text-sm mt-3">{{ errorRef }}</p>

        <div class="flex items-center gap-3 mt-5">
          <UiButton type="submit" :disabled="!isDirty || !canSubmit">
            {{ isSubmitting ? t('customers.slideover.saving') : t('customers.slideover.save') }}
          </UiButton>
        </div>
      </form>
    </template>
  </USlideover>
</template>
