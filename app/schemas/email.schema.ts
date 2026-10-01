import { emailRule } from '@crm/validation'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

// Проводка сообщений host-i18n в общее правило (вся логика — в пакете).
export const createEmailSchema = (t: TranslateFn) =>
  emailRule({
    required: t('validation.emailRequired'),
    tooLong: t('validation.emailTooLong'),
    invalid: t('validation.emailInvalid'),
  })
