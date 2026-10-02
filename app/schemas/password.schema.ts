import { z } from 'zod'
import { isAsciiPrintable, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '~/utils/validation'
import type { TranslateFn } from './email.schema'

export interface PasswordValidationMessages {
  empty: string
  tooLong: string
  tooShort?: string
  invalid: string
}

// false - без минимума (для логина чтобы не палить политику), иначе min+max как на бэке
export const createPasswordSchemaFromMessages = (
  messages: PasswordValidationMessages,
  options: { minLength?: number | false } = {},
) => {
  const minLength = options.minLength ?? PASSWORD_MIN_LENGTH
  if (minLength === false) {
    return z
      .string()
      .superRefine((v, ctx) => {
        if (!v) {
          ctx.addIssue({ code: 'custom', message: messages.empty })
          return
        }
        if (v.length > PASSWORD_MAX_LENGTH) {
          ctx.addIssue({ code: 'custom', message: messages.tooLong })
          return
        }
        if (!isAsciiPrintable(v)) {
          ctx.addIssue({ code: 'custom', message: messages.invalid })
        }
      })
  }
  return z
    .string()
    .min(minLength, messages.tooShort ?? messages.empty)
    .max(PASSWORD_MAX_LENGTH, messages.tooLong)
    .refine((v) => isAsciiPrintable(v), messages.invalid)
}

// сообщения всегда из validation.*, минимумом рулит вызывающий
export const createPasswordSchema = (
  t: TranslateFn,
  options: { minLength?: number | false } = {},
) =>
  createPasswordSchemaFromMessages(
    {
      empty: t('validation.passwordRequired'),
      tooShort: t('validation.passwordTooShort'),
      tooLong: t('validation.passwordTooLong'),
      invalid: t('validation.passwordInvalid'),
    },
    options,
  )
