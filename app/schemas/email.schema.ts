import { z } from 'zod'
import { containsControlChars, isValidEmailFormat } from '~/utils/validation'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export interface EmailValidationMessages {
  // null — поле опционально: пустое значение валидно (карточка клиента).
  required: string | null
  tooLong: string
  invalid: string
}

// Общее правило для email — зеркало backend DTO (trim+lowercase, max 254).
// Одна ошибка за раз: пусто → required (или ок, если опционально),
// иначе длина/формат.
export const createEmailSchemaFromMessages = (messages: EmailValidationMessages) =>
  z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) {
        if (messages.required === null) return
        ctx.addIssue({ code: 'custom', message: messages.required })
        return
      }
      if (v.length > 254) {
        ctx.addIssue({ code: 'custom', message: messages.tooLong })
        return
      }
      // Управляющие символы (\0, \n, ...) формат-regex не ловит — проверяем явно.
      if (!isValidEmailFormat(v) || containsControlChars(v)) {
        ctx.addIssue({ code: 'custom', message: messages.invalid })
      }
    })

// Правило для email-полей: сообщения всегда одинаковые (validation.*),
// поэтому scope не нужен. Для особых случаев — createEmailSchemaFromMessages.
export const createEmailSchema = (t: TranslateFn) =>
  createEmailSchemaFromMessages({
    required: t('validation.emailRequired'),
    tooLong: t('validation.emailTooLong'),
    invalid: t('validation.emailInvalid'),
  })

// Опциональный email (карточка клиента): пустое значение валидно,
// иначе — те же длина/формат, что у обязательного.
export const createOptionalEmailSchema = (t: TranslateFn) =>
  createEmailSchemaFromMessages({
    required: null,
    tooLong: t('validation.emailTooLong'),
    invalid: t('validation.emailInvalid'),
  })
