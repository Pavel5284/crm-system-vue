import { z } from 'zod'
import { isPhoneDisplayValid } from '@crm/ui-kit/phone'
import type { TranslateFn } from './email.schema'

export interface PhoneValidationMessages {
  invalid: string
}

// Телефон опционален: пустое значение валидно, иначе — формат дисплея
// (7-20 цифр, зеркало isPhoneDisplayValid из ui-kit).
export const createPhoneSchemaFromMessages = (messages: PhoneValidationMessages) =>
  z
    .string()
    .trim()
    .refine((v) => !v || isPhoneDisplayValid(v), messages.invalid)

// Правило для phone-полей: сообщение всегда одинаковое.
// Для особых случаев — createPhoneSchemaFromMessages.
export const createPhoneSchema = (t: TranslateFn) =>
  createPhoneSchemaFromMessages({
    invalid: t('settings.profile.validation.phoneInvalid'),
  })
