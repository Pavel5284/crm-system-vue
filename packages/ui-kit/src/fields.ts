// Чистые валидаторы текстовых полей (без фреймворков и i18n —
// сообщения маппит вызывающая сторона). Единственный источник regex
// для host (app/utils/validation.ts реэкспортирует отсюда) и remotes.

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmailFormat = (value: string): boolean =>
  EMAIL_FORMAT_RE.test(value)

// Управляющие символы (NUL, \n, \r, \t, DEL и остальные C0):
// в однострочных полях им неоткуда взяться от живого пользователя,
// а для логов/хранилища это грязь (инъекция переносов, обрыв строк).
// eslint-disable-next-line no-control-regex -- guard намеренно ищет управляющие символы.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/

export const containsControlChars = (value: string): boolean =>
  CONTROL_CHARS_RE.test(value)
