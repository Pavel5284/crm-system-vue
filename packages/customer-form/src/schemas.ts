import { z } from 'zod'
import { containsControlChars, isValidEmailFormat } from '@crm/ui-kit/fields'
import { isPhoneDisplayValid } from '@crm/ui-kit/phone'
import { CUSTOMER_FORM_LIMITS, type CustomerFormLabels } from './types'

// Правила формы клиента — зеркало backend UpdateCustomerDto.
// Сообщения приходят готовыми через labels (i18n остаётся у вызывающей
// стороны: host — useI18n, remote — STRINGS). Одна ошибка за раз.

export interface CustomerFormSchemas {
  name: z.ZodType<string, unknown>
  email: z.ZodType<string, unknown>
  phone: z.ZodType<string, unknown>
  text: z.ZodType<string, unknown>
}

export const createCustomerFormSchemas = (messages: CustomerFormLabels): CustomerFormSchemas => ({
  // Имя: обязательное (после trim), макс. длина, без управляющих символов.
  name: z
    .string()
    .trim()
    .min(1, messages.nameRequired)
    .max(CUSTOMER_FORM_LIMITS.textMaxLength, messages.nameTooLong)
    .refine((v) => !containsControlChars(v), messages.nameInvalid),

  // Email опционален: пустое значение валидно, иначе — длина/формат.
  email: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) return
      if (v.length > CUSTOMER_FORM_LIMITS.emailMaxLength) {
        ctx.addIssue({ code: 'custom', message: messages.emailTooLong })
        return
      }
      if (!isValidEmailFormat(v) || containsControlChars(v)) {
        ctx.addIssue({ code: 'custom', message: messages.emailInvalid })
      }
    }),

  // Телефон опционален: пустое значение валидно, иначе — формат дисплея.
  phone: z
    .string()
    .trim()
    .refine((v) => !v || isPhoneDisplayValid(v), messages.phoneInvalid),

  // Контактное лицо / источник: опциональные однострочные тексты.
  text: z
    .string()
    .trim()
    .max(CUSTOMER_FORM_LIMITS.textMaxLength, messages.textTooLong)
    .refine((v) => !containsControlChars(v), messages.textInvalid),
})

// TanStack принимает zod напрямую только если версии типов совпадают
// (у хоста typeCheck выключен — там это не ловится, а строгая DTS-сборка
// remote падает). Адаптер держит совместимость на уровне поведения:
// первая ошибка схемы строкой, валидно — undefined.
export type CustomerFieldValidator = (props: { value: unknown }) => string | undefined

export const toFieldValidator = (
  schema: Pick<z.ZodType<string, unknown>, 'safeParse'>,
): CustomerFieldValidator =>
  ({ value }) => {
    const result = schema.safeParse(value)
    if (result.success) return undefined
    return result.error.issues[0]?.message
  }
