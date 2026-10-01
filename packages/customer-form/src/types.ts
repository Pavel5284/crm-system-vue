import type { CustomerDto, UpdateCustomerPayload } from '@crm/mfe-contracts'

// Лимиты — зеркало backend UpdateCustomerDto (источник истины — сервер).
// Родитель использует их для интерполяции сообщений (textTooLong и т.п.).
export const CUSTOMER_FORM_LIMITS = {
  textMaxLength: 200,
  emailMaxLength: 254,
} as const

// Минимальный структурный тип клиента для формы (id нужен только
// для сброса черновика при смене клиента). Удовлетворяют и host
// CustomerDto, и mfe-contracts CustomerDto.
export interface CustomerFormCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  contactPerson: string | null
  avatarUrl: string
  fromSource: string | null
}

export interface CustomerFormValues {
  name: string
  email: string
  phone: string
  contactPerson: string
  fromSource: string
}

// Все строки формы — одним объектом (у ui-kit/AvatarUploader свой
// labels для аватара — см. avatarLabels ниже). Без i18n внутри пакета:
// host маппит из useI18n, remote — из своих STRINGS.
export interface CustomerFormLabels {
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  phoneLabel: string
  phonePlaceholder: string
  phoneHint: string
  contactLabel: string
  contactPlaceholder: string
  sourceLabel: string
  sourcePlaceholder: string
  avatarHint: string
  save: string
  saving: string
  // Сообщения валидации (уже финализированные — с подставленными лимитами).
  nameRequired: string
  nameTooLong: string
  nameInvalid: string
  emailTooLong: string
  emailInvalid: string
  phoneInvalid: string
  textTooLong: string
  textInvalid: string
}

// Подписи AvatarUploader (его собственный формат labels).
export interface CustomerFormAvatarLabels {
  upload: string
  remove: string
  fileTooLarge: string
  onlyImage: string
  readError: string
}

export type { UpdateCustomerPayload }

// Строка таблицы — полный DTO (emit `select` отдаёт объект как есть,
// обработчики принимают CustomerDto с обеих сторон). Host CustomerDto
// структурно совместим.
export type CustomerTableCustomer = CustomerDto

// Подписи таблицы. Без i18n внутри пакета: host маппит из useI18n,
// remote — из своих STRINGS.
export interface CustomerTableLabels {
  listTitle: string
  loading: string
  empty: string
  avatarCol: string
  nameCol: string
  emailCol: string
  phoneCol: string
  contactCol: string
  sourceCol: string
  dealsCol: string
}
