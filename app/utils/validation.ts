// лимиты как на бэке, чтобы зря в сеть не ходить
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const NAME_MAX_LENGTH = 100
// клиенты/сделки - max 200
export const CUSTOMER_TEXT_MAX_LENGTH = 200
// комменты - max 2000
export const COMMENT_TEXT_MAX_LENGTH = 2000

export { containsControlChars, isValidEmailFormat } from '@crm/validation'

// пароли только ascii, с юникодом были приколы с хешами
const ASCII_PRINTABLE_RE = /^[ -~]*$/

export const isAsciiPrintable = (value: string): boolean =>
  ASCII_PRINTABLE_RE.test(value)
