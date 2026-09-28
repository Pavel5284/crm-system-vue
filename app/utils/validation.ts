// Клиентские лимиты — зеркало бэкенд-DTO, чтобы невалидные
// формы не уходили в сеть. Источник истины — сервер, здесь только UX-фильтр.
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100
// Текстовые поля клиентов/сделок (customers/dto, deals/dto) — max 200.
export const CUSTOMER_TEXT_MAX_LENGTH = 200

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmailFormat = (value: string): boolean =>
  EMAIL_FORMAT_RE.test(value)

// Управляющие символы (NUL, \n, \r, \t, DEL и остальные C0):
// в однострочных полях им неоткуда взяться от живого пользователя,
// а для логов/хранилища это грязь (инъекция переносов, обрыв строк).
// NB: пароли НЕ проверяем — там допустим любой состав, их нейтрализует хеш.
// eslint-disable-next-line no-control-regex -- guard намеренно ищет управляющие символы.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/

export const containsControlChars = (value: string): boolean =>
  CONTROL_CHARS_RE.test(value)

// Печатный ASCII: от пробела до тильды — латиница, цифры, спецсимволы.
// Пароли ограничиваем им, чтобы не было проблем с нормализацией Unicode
// (один и тот же символ в NFC/NFD хешируется по-разному) и омоглифами
// (латинская "a" и кириллическая "а" выглядят одинаково, хеши — нет).
const ASCII_PRINTABLE_RE = /^[ -~]*$/

export const isAsciiPrintable = (value: string): boolean =>
  ASCII_PRINTABLE_RE.test(value)
