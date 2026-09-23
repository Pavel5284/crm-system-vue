// Клиентские лимиты — зеркало бэкенд-DTO (auth/dto), чтобы невалидные
// формы не уходили в сеть. Источник истины — сервер, здесь только UX-фильтр.
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmailFormat = (value: string): boolean =>
  EMAIL_FORMAT_RE.test(value)
