import { z } from 'zod'
import { isPhoneDisplayValid } from '@crm/ui-kit/phone'

// ---------------------------------------------------------------------------
// Чистые предикаты (без фреймворков и i18n). Единственный источник regex.
// ---------------------------------------------------------------------------

const EMAIL_FORMAT_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

// Email — только латиница (продуктовое решение). Зеркало — бэкенд-константа
// ASCII_EMAIL_PATTERN в `@app/shared`: править оба места 1-в-1.
export const isValidEmailFormat = (value: string): boolean =>
  EMAIL_FORMAT_RE.test(value)

// Управляющие символы (NUL, \n, \r, \t, DEL и остальные C0):
// в однострочных полях им неоткуда взяться от живого пользователя,
// а для логов/хранилища это грязь (инъекция переносов, обрыв строк).
// NB: пароли ими НЕ проверяем — там допустим любой состав, их нейтрализует хеш.
// eslint-disable-next-line no-control-regex -- guard намеренно ищет управляющие символы.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/

export const containsControlChars = (value: string): boolean =>
  CONTROL_CHARS_RE.test(value)

// ---------------------------------------------------------------------------
// Zod-фабрики с инжектом сообщений. Сообщения готовит вызывающая сторона
// (host — через t(), пакет — через labels): здесь только формы правил.
// Одна ошибка за раз.
// ---------------------------------------------------------------------------

export interface EmailMessages {
  required: string
  tooLong: string
  invalid: string
}

export interface NameMessages {
  required: string
  tooLong: string
  invalid: string
}

export interface PhoneMessages {
  invalid: string
}

export interface TextMessages {
  tooLong: string
  invalid: string
}

export const emailRule = (
  messages: EmailMessages,
  opts: { required?: boolean; maxLength?: number } = {},
): z.ZodType<string, unknown> => {
  const { required = true, maxLength = 254 } = opts
  return z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) {
        if (!required) return
        ctx.addIssue({ code: 'custom', message: messages.required })
        return
      }
      if (v.length > maxLength) {
        ctx.addIssue({ code: 'custom', message: messages.tooLong })
        return
      }
      // Управляющие символы (\0, \n, ...) формат-regex не ловит — проверяем явно.
      if (!isValidEmailFormat(v) || containsControlChars(v)) {
        ctx.addIssue({ code: 'custom', message: messages.invalid })
      }
    })
}

export const nameRule = (
  messages: NameMessages,
  opts: { maxLength?: number } = {},
): z.ZodType<string, unknown> => {
  const { maxLength = 100 } = opts
  return z
    .string()
    .trim()
    .min(1, messages.required)
    .max(maxLength, messages.tooLong)
    .refine((v) => !containsControlChars(v), messages.invalid)
}

export const phoneRule = (messages: PhoneMessages): z.ZodType<string, unknown> =>
  z
    .string()
    .trim()
    .refine((v) => !v || isPhoneDisplayValid(v), messages.invalid)

export const textRule = (
  messages: TextMessages,
  opts: { maxLength: number },
): z.ZodType<string, unknown> =>
  z
    .string()
    .trim()
    .max(opts.maxLength, messages.tooLong)
    .refine((v) => !containsControlChars(v), messages.invalid)

// ---------------------------------------------------------------------------
// Адаптер для TanStack Form: zod напрямую принимается, только если версии
// типов совпадают (у хоста typeCheck выключен — там это не ловится,
// а строгая DTS-сборка remote падает). Совместимость на уровне поведения:
// первая ошибка схемы строкой, валидно — undefined.
// ---------------------------------------------------------------------------

export type FieldValidator = (props: { value: unknown }) => string | undefined

export const toFieldValidator = (
  schema: Pick<z.ZodType<string, unknown>, 'safeParse'>,
): FieldValidator =>
  ({ value }) => {
    const result = schema.safeParse(value)
    if (result.success) return undefined
    return result.error.issues[0]?.message
  }
