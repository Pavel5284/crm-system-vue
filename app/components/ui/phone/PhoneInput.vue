<script setup lang="ts">
import { parsePhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import MazInputPhoneNumber from 'maz-ui/components/MazInputPhoneNumber'

// v-model — полная строка номера (E.164 или отформатированная, напр. "+79991234567").
const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue?: string
    disabled?: boolean
    defaultCountry?: CountryCode
    error?: boolean
  }>(),
  {
    modelValue: '',
    disabled: false,
    defaultCountry: 'RU',
    error: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const preferredCountries: CountryCode[] = ['RU', 'KZ', 'BY']
const countryCode = ref<CountryCode>(props.defaultCountry)

// Синк страны от родителя (предзаполнение): код выводим из полного номера
watch(
  () => props.modelValue,
  (full) => {
    try {
      const parsed = parsePhoneNumber(full ?? '')
      if (parsed.country && parsed.country !== countryCode.value) countryCode.value = parsed.country
    } catch {
      // Неполное значение — страну не трогаем
    }
  },
  { immediate: true },
)

const countryLocale = computed(() => (locale.value === 'ru' ? 'ru-RU' : 'en-US'))

const translations = computed(() => ({
  countrySelect: {
    placeholder: t('settings.profile.countryCodePlaceholder'),
    error: t('settings.profile.countryError'),
    searchPlaceholder: t('settings.profile.countrySearch'),
  },
  phoneInput: {
    placeholder: t('settings.profile.phonePlaceholder'),
    example: t('settings.profile.phoneExample'),
  },
}))
</script>

<template>
  <div class="ui-phone-maz">
    <MazInputPhoneNumber
      :model-value="modelValue ?? ''"
      v-model:country-code="countryCode"
      :disabled="disabled"
      :error="error"
      :preferred-countries="preferredCountries"
      :use-browser-locale="false"
      auto-format="typing"
      show-code-in-list
      orientation="row"
      size="sm"
      block
      :country-locale="countryLocale"
      :translations="translations"
      @update:model-value="(val: string | null | undefined) => emit('update:modelValue', val ?? '')"
    >
      <template #selector-flag="{ countryCode: code }">
        <span class="ui-phone-maz-badge">{{ code }}</span>
      </template>
      <template #country-list-flag="{ countryCode: code }">
        <span class="ui-phone-maz-badge">{{ code }}</span>
      </template>
      <template #no-results>
        <span class="ui-phone-maz-noresults">{{ t('settings.profile.countryNoResults') }}</span>
      </template>
    </MazInputPhoneNumber>
  </div>
</template>

<!--
  Глобальные стили (без scoped): часть разметки (popover дропдауна)
  живёт вне компонента. Приложение всегда тёмное — палитра захардкожена
  под тёмную тему (HSL-триплеты в формате maz-ui).
-->
<style>
.ui-phone-maz {
  --maz-font-family: "Lato", sans-serif;
  --maz-radius: 0.625rem;
  --maz-border-width: 1px;
  --maz-background: 0 0% 14%;
  --maz-background-300: 0 0% 18%;
  --maz-background-400: 0 0% 22%;
  --maz-background-600: 0 0% 27%;
  --maz-foreground: 0 0% 98%;
  --maz-muted: 0 0% 71%;
  --maz-border: 0 0% 27%;
  --maz-border-400: 0 0% 34%;
  --maz-primary: 217 91% 60%;
  --maz-primary-500: 217 91% 55%;
  --maz-primary-600: 217 91% 48%;
  --maz-primary-foreground: 0 0% 100%;
  --maz-secondary: 0 0% 27%;
  --maz-secondary-600: 0 0% 32%;
  --maz-secondary-foreground: 0 0% 98%;
  --maz-accent: 217 91% 60%;
  --maz-accent-600: 217 91% 48%;
  --maz-accent-foreground: 0 0% 100%;
  --maz-destructive: 0 84% 60%;
  --maz-destructive-600: 0 72% 51%;
  --maz-destructive-foreground: 0 0% 98%;
  --maz-success: 80 61% 50%;
  --maz-success-600: 80 62% 42%;
  --maz-success-foreground: 210 8% 14%;
  --maz-warning: 40 97% 59%;
  --maz-warning-600: 40 100% 51%;
  --maz-warning-foreground: 210 8% 14%;
  --maz-info: 188 78% 41%;
  --maz-info-600: 188 80% 33%;
  --maz-info-foreground: 0 0% 100%;
  --maz-contrast: 0 0% 100%;
  --maz-contrast-600: 0 0% 85%;
  --maz-contrast-foreground: 210 8% 14%;
  --maz-shadow: 0 0% 0%;
}

.ui-phone-maz .m-input-phone-number .m-input-wrapper-input.--sm .m-input-input,
.ui-phone-maz .m-input-phone-number .m-input-wrapper-input.--sm .m-input-label {
  font-size: var(--text-sm);
}

.ui-phone-maz .ui-phone-maz-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 4px 5px;
  border-radius: calc(var(--radius-md) - 4px);
  background-color: var(--muted);
  color: var(--muted-foreground);
  white-space: nowrap;
}

.ui-phone-maz .ui-phone-maz-noresults {
  display: block;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm);
  color: var(--muted-foreground);
}
</style>
