// Клиентские лимиты — зеркало бэкенд-DTO, чтобы невалидные
// формы не уходили в сеть. Источник истины — сервер, здесь только UX-фильтр.
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100
// Текстовые поля клиентов/сделок (customers/dto, deals/dto) — max 200.
export const CUSTOMER_TEXT_MAX_LENGTH = 200
// Текст комментария к сделке (comments/dto) — max 2000.
export const COMMENT_TEXT_MAX_LENGTH = 2000

// Regex-предикаты — из общего пакета правил (единственный источник).
// NB: пароли ими НЕ проверяем — там допустим любой состав, их нейтрализует хеш.
export { containsControlChars, isValidEmailFormat } from '@crm/validation'

// Печатный ASCII: от пробела до тильды — латиница, цифры, спецсимволы.
// Пароли ограничиваем им, чтобы не было проблем с нормализацией Unicode
// (один и тот же символ в NFC/NFD хешируется по-разному) и омоглифами
// (латинская "a" и кириллическая "а" выглядят одинаково, хеши — нет).
const ASCII_PRINTABLE_RE = /^[ -~]*$/

export const isAsciiPrintable = (value: string): boolean =>
  ASCII_PRINTABLE_RE.test(value)
