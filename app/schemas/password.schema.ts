import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '~/utils/validation'
import type { TranslateFn } from './email.schema'

export interface PasswordValidationMessages {
  // Текст на пустое значение (в min-режиме для пустого используется tooShort).
  empty: string
  tooLong: string
  // Текст на значение короче minLength; по умолчанию совпадает с empty.
  tooShort?: string
}

// minLength: false — без проверки минимума (политику не раскрываем,
// только empty + верхний лимит). Иначе min + max (зеркало backend DTO).
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
        }
      })
  }
  return z
    .string()
    .min(minLength, messages.tooShort ?? messages.empty)
    .max(PASSWORD_MAX_LENGTH, messages.tooLong)
}

// Правило для password-полей: сообщения всегда одинаковые (validation.*),
// политикой минимума управляет вызывающий: login — { minLength: false },
// остальные — дефолт (min 8). Для особых случаев — createPasswordSchemaFromMessages.
export const createPasswordSchema = (
  t: TranslateFn,
  options: { minLength?: number | false } = {},
) =>
  createPasswordSchemaFromMessages(
    {
      empty: t('validation.passwordRequired'),
      tooShort: t('validation.passwordTooShort'),
      tooLong: t('validation.passwordTooLong'),
    },
    options,
  )
