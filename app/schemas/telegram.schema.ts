import { z } from 'zod'
import type { TranslateFn } from './email.schema'

export interface TelegramValidationMessages {
  invalid: string
}

// Формат Telegram: опциональное @ + 3-32 символа (a-z, 0-9, _).
const TELEGRAM_FORMAT_RE = /^@?[a-zA-Z0-9_]{3,32}$/

export const isValidTelegram = (value: string): boolean =>
  !value || TELEGRAM_FORMAT_RE.test(value)

// Поле необязательное: пустое значение валидно, иначе — строгий формат.
// Зеркало backend UpdateProfileDto.telegram (Matches + MaxLength).
export const createTelegramSchemaFromMessages = (messages: TelegramValidationMessages) =>
  z
    .string()
    .trim()
    .refine((v) => isValidTelegram(v), messages.invalid)

// Правило для telegram-полей: сообщение всегда одинаковое (validation.*).
// Для особых случаев — createTelegramSchemaFromMessages.
export const createTelegramSchema = (t: TranslateFn) =>
  createTelegramSchemaFromMessages({
    invalid: t('validation.telegramInvalid'),
  })
