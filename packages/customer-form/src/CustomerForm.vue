<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm as useTanStackForm } from '@tanstack/vue-form'
import AvatarUploader from '@crm/ui-kit/AvatarUploader.vue'
import PhoneInput from '@crm/ui-kit/PhoneInput.vue'
import { getInitials } from '@crm/ui-kit/avatar'
import {
  emailRule,
  nameRule,
  phoneRule,
  textRule,
  toFieldValidator,
} from '@crm/validation'
import { CUSTOMER_FORM_LIMITS } from './types'
import type {
  CustomerFormAvatarLabels,
  CustomerFormCustomer,
  CustomerFormLabels,
  CustomerFormValues,
  UpdateCustomerPayload,
} from './types'

// Общая форма клиента (host + remotes): разметка, лейблы и валидация
// в одном месте. Без i18n внутри — все строки пропсом `labels`.
// HTTP наружу событиями: сохранение — `save`, аватар —
// `upload-avatar`/`remove-avatar` (владельцем avatarUrl остаётся родитель).
// Обёртка диалога (USlideover хоста / Dialog remote) — снаружи:
// сюда входит только тело формы.
// Иконка кнопки аватара различается (Nuxt-Icon vs lucide) —
// обязательный скоупед-слот `avatar-icon` ({ saving: boolean }).

const props = withDefaults(
  defineProps<{
    customer: CustomerFormCustomer | null
    labels: CustomerFormLabels
    avatarLabels: CustomerFormAvatarLabels
    avatarUrl?: string
    avatarSaving?: boolean
    saving?: boolean
    serverError?: string
  }>(),
  {
    avatarUrl: '',
    avatarSaving: false,
    saving: false,
    serverError: '',
  },
)

const emit = defineEmits<{
  save: [payload: UpdateCustomerPayload]
  'upload-avatar': [dataUrl: string]
  'remove-avatar': []
}>()

// Классы — 1-в-1 host `ui/input` + `ui/button` (единственная копия;
// раньше эти же строки лежали константами INPUT_CLASS/BTN_* в remote).
// Все они обязаны быть в CSS хоста (remote пользуется его сборкой).
const INPUT_CLASS =
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
const BTN_BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 has-[>svg]:px-3'
const BTN_DEFAULT = 'bg-primary text-primary-foreground hover:opacity-75'

const emptyValues: CustomerFormValues = {
  name: '',
  email: '',
  phone: '',
  contactPerson: '',
  fromSource: '',
}

const toFormValues = (c: CustomerFormCustomer): CustomerFormValues => ({
  name: c.name,
  email: c.email,
  phone: c.phone ?? '',
  contactPerson: c.contactPerson ?? '',
  fromSource: c.fromSource ?? '',
})

// Валидация при каждом вводе (onChange) + повторный прогон на сабмите:
// `save` эмитится только при валидной форме. Нормализация пейлоада
// (trim, пустое → null) — здесь же, единая для host и remote.
const form = useTanStackForm({
  defaultValues: { ...emptyValues },
  onSubmit: ({ value }) => {
    const payload: UpdateCustomerPayload = {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim() || null,
      contactPerson: value.contactPerson.trim() || null,
      fromSource: value.fromSource.trim() || null,
    }
    emit('save', payload)
  },
})

const CustomerFormField = form.Field
const formValues = form.useStore((state) => state.values)
const isDirty = form.useStore((state) => state.isDirty)
const canSubmit = form.useStore((state) => state.canSubmit)
const isSubmitting = form.useStore((state) => state.isSubmitting)

// Проводка labels в общие правила @crm/validation (вся логика — там).
// Адаптеры строим один раз (не в шаблоне): TanStack зовёт их при каждом вводе.
const validators = {
  name: toFieldValidator(
    nameRule(
      {
        required: props.labels.nameRequired,
        tooLong: props.labels.nameTooLong,
        invalid: props.labels.nameInvalid,
      },
      { maxLength: CUSTOMER_FORM_LIMITS.textMaxLength },
    ),
  ),
  email: toFieldValidator(
    // required-сообщение не нужно: email здесь всегда опционален.
    emailRule(
      {
        required: '',
        tooLong: props.labels.emailTooLong,
        invalid: props.labels.emailInvalid,
      },
      { required: false },
    ),
  ),
  phone: toFieldValidator(phoneRule({ invalid: props.labels.phoneInvalid })),
  text: toFieldValidator(
    textRule(
      { tooLong: props.labels.textTooLong, invalid: props.labels.textInvalid },
      { maxLength: CUSTOMER_FORM_LIMITS.textMaxLength },
    ),
  ),
}

// Первая ошибка поля (схемы выдают по одной за раз).
const resolveError = (errors: unknown): string | undefined => {
  const list = Array.isArray(errors) ? errors : []
  for (const e of list) {
    const message =
      typeof e === 'string' ? e : (e as { message?: unknown } | null)?.message
    if (typeof message === 'string' && message) return message
  }
  return undefined
}

const fieldError = (errors: unknown): string => resolveError(errors) ?? ''

const onTextInput = (field: { handleChange: (v: string) => void }, e: Event) => {
  field.handleChange((e.target as HTMLInputElement).value)
}

watch(
  () => props.customer,
  (customer) => {
    if (customer) form.reset(toFormValues(customer))
  },
  { immediate: true },
)

const initials = computed(() =>
  getInitials(formValues.value.name || props.customer?.name || ''),
)
</script>

<template>
  <div class="mb-5 flex flex-col items-center gap-3">
    <AvatarUploader
      :model-value="props.avatarUrl"
      :initials="initials"
      :size="96"
      :saving="props.avatarSaving"
      :labels="props.avatarLabels"
      @upload="(dataUrl: string) => emit('upload-avatar', dataUrl)"
      @remove="() => emit('remove-avatar')"
    >
      <template #icon="slotProps">
        <slot name="avatar-icon" v-bind="slotProps" />
      </template>
    </AvatarUploader>
    <p class="text-xs text-muted-foreground">{{ props.labels.avatarHint }}</p>
  </div>

  <form autocomplete="on" @submit.prevent="() => form.handleSubmit()">
    <div class="field">
      <label class="label">{{ props.labels.nameLabel }}</label>
      <CustomerFormField name="name" :validators="{ onChange: validators.name }" v-slot="{ field }">
        <input
          :value="field.state.value as string"
          type="text"
          :placeholder="props.labels.namePlaceholder"
          :class="INPUT_CLASS"
          :aria-invalid="field.state.meta.errors.length > 0"
          @input="onTextInput(field, $event)"
          @blur="field.handleBlur"
        />
        <p class="text-[11px] mt-1" :class="resolveError(field.state.meta.errors) ? 'text-red-500' : 'invisible'">
          {{ resolveError(field.state.meta.errors) || String.fromCharCode(160) }}
        </p>
      </CustomerFormField>
    </div>

    <div class="field">
      <label class="label">{{ props.labels.emailLabel }}</label>
      <CustomerFormField name="email" :validators="{ onChange: validators.email }" v-slot="{ field }">
        <input
          :value="field.state.value as string"
          type="email"
          :placeholder="props.labels.emailPlaceholder"
          :class="INPUT_CLASS"
          :aria-invalid="field.state.meta.errors.length > 0"
          @input="onTextInput(field, $event)"
          @blur="field.handleBlur"
        />
        <p class="text-[11px] mt-1" :class="resolveError(field.state.meta.errors) ? 'text-red-500' : 'invisible'">
          {{ resolveError(field.state.meta.errors) || String.fromCharCode(160) }}
        </p>
      </CustomerFormField>
    </div>

    <div class="field">
      <label class="label">{{ props.labels.phoneLabel }}</label>
      <CustomerFormField name="phone" :validators="{ onChange: validators.phone }" v-slot="{ field }">
        <PhoneInput
          :model-value="field.state.value as string"
          :placeholder="props.labels.phonePlaceholder"
          :hint="props.labels.phoneHint"
          :error="fieldError(field.state.meta.errors)"
          @update:model-value="(val: string) => field.handleChange(val)"
          @blur="field.handleBlur"
        />
      </CustomerFormField>
    </div>

    <div class="field">
      <label class="label">{{ props.labels.contactLabel }}</label>
      <CustomerFormField name="contactPerson" :validators="{ onChange: validators.text }" v-slot="{ field }">
        <input
          :value="field.state.value as string"
          type="text"
          :placeholder="props.labels.contactPlaceholder"
          :class="INPUT_CLASS"
          :aria-invalid="field.state.meta.errors.length > 0"
          @input="onTextInput(field, $event)"
          @blur="field.handleBlur"
        />
        <p class="text-[11px] mt-1" :class="resolveError(field.state.meta.errors) ? 'text-red-500' : 'invisible'">
          {{ resolveError(field.state.meta.errors) || String.fromCharCode(160) }}
        </p>
      </CustomerFormField>
    </div>

    <div class="field">
      <label class="label">{{ props.labels.sourceLabel }}</label>
      <CustomerFormField name="fromSource" :validators="{ onChange: validators.text }" v-slot="{ field }">
        <input
          :value="field.state.value as string"
          type="text"
          :placeholder="props.labels.sourcePlaceholder"
          :class="INPUT_CLASS"
          :aria-invalid="field.state.meta.errors.length > 0"
          @input="onTextInput(field, $event)"
          @blur="field.handleBlur"
        />
        <p class="text-[11px] mt-1" :class="resolveError(field.state.meta.errors) ? 'text-red-500' : 'invisible'">
          {{ resolveError(field.state.meta.errors) || String.fromCharCode(160) }}
        </p>
      </CustomerFormField>
    </div>

    <p v-if="props.serverError" class="text-red-500 text-sm mt-3">{{ props.serverError }}</p>

    <div class="flex items-center gap-3 mt-5">
      <button type="submit" :class="[BTN_BASE, BTN_DEFAULT]" :disabled="!isDirty || !canSubmit || props.saving || isSubmitting">
        {{ props.saving || isSubmitting ? props.labels.saving : props.labels.save }}
      </button>
    </div>
  </form>
</template>
