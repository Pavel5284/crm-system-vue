import { nameRule } from '@crm/validation'
import { NAME_MAX_LENGTH } from '~/utils/validation'
import type { TranslateFn } from './email.schema'

// Проводка сообщений host-i18n в общее правило (вся логика — в пакете).
export const createNameSchema = (
  t: TranslateFn,
  options: { maxLength?: number } = {},
) =>
  nameRule(
    {
      required: t('validation.nameRequired'),
      tooLong: t('validation.nameTooLong'),
      invalid: t('validation.nameInvalid'),
    },
    { maxLength: options.maxLength ?? NAME_MAX_LENGTH },
  )
