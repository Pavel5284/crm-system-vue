import { z } from 'zod'
import { containsControlChars } from '~/utils/validation'
import type { TranslateFn } from './email.schema'

export interface OptionalTextValidationMessages {
  tooLong: string
  invalid: string
}

// Опциональная однострочная строка: пустая валидна, иначе — макс. длина
// и без управляющих символов (инъекция переносов в логи/хранилище).
// Зеркало backend UpdateCustomerDto (MaxLength 200).
export const createOptionalTextSchemaFromMessages = (
  messages: OptionalTextValidationMessages,
  options: { maxLength: number },
) =>
  z
    .string()
    .trim()
    .max(options.maxLength, messages.tooLong)
    .refine((v) => !containsControlChars(v), messages.invalid)

// Правило для опциональных текстовых полей (контактное лицо, источник).
// Для особых случаев — createOptionalTextSchemaFromMessages.
export const createOptionalTextSchema = (
  t: TranslateFn,
  options: { maxLength: number },
) =>
  createOptionalTextSchemaFromMessages(
    {
      tooLong: t('validation.textTooLong', { max: options.maxLength }),
      invalid: t('validation.invalidCharacters'),
    },
    options,
  )
