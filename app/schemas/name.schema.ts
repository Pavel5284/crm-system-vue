import { z } from 'zod'
import { containsControlChars, NAME_MAX_LENGTH } from '~/utils/validation'
import type { TranslateFn } from './email.schema'

export interface NameValidationMessages {
  required: string
  tooLong: string
  invalid: string
}

// Имя: обязательное (после trim), максимум NAME_MAX_LENGTH символов,
// без управляющих символов (инъекция переносов в однострочное поле).
export const createNameSchemaFromMessages = (
  messages: NameValidationMessages,
  options: { maxLength?: number } = {},
) => {
  const maxLength = options.maxLength ?? NAME_MAX_LENGTH
  return z
    .string()
    .trim()
    .min(1, messages.required)
    .max(maxLength, messages.tooLong)
    .refine((v) => !containsControlChars(v), messages.invalid)
}

// Правило для name-полей: сообщения всегда одинаковые (validation.*).
// Для особых случаев — createNameSchemaFromMessages.
export const createNameSchema = (
  t: TranslateFn,
  options: { maxLength?: number } = {},
) =>
  createNameSchemaFromMessages(
    {
      required: t('validation.nameRequired'),
      tooLong: t('validation.nameTooLong'),
      invalid: t('validation.nameInvalid'),
    },
    options,
  )
