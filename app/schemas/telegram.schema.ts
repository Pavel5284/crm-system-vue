import { z } from 'zod'
import type { TranslateFn } from './email.schema'

export interface TelegramValidationMessages {
  invalid: string
}

// @ + 3-32 символа
const TELEGRAM_FORMAT_RE = /^@?[a-zA-Z0-9_]{3,32}$/

export const isValidTelegram = (value: string): boolean =>
  !value || TELEGRAM_FORMAT_RE.test(value)

// пустое ок, иначе строгий формат как на бэке
export const createTelegramSchemaFromMessages = (messages: TelegramValidationMessages) =>
  z
    .string()
    .trim()
    .refine((v) => isValidTelegram(v), messages.invalid)

export const createTelegramSchema = (t: TranslateFn) =>
  createTelegramSchemaFromMessages({
    invalid: t('validation.telegramInvalid'),
  })
