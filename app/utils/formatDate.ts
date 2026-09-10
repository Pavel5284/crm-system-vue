import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import 'dayjs/locale/en'

export type DateFormat = 'full' | 'short' | 'long' | 'datetime' | string

const FORMAT_MAP: Record<string, string> = {
  full: 'DD.MM.YYYY HH:mm',
  short: 'DD MMM YYYY',
  long: 'DD MMMM YYYY',
  datetime: 'YYYY-MM-DD HH:mm:ss.SSS',
}

export const formatDate = (
  value: string | number | Date | null | undefined,
  format: DateFormat = 'full',
  locale?: string | { value?: string } | { toString(): string },
): string => {
  if (!value) return '-'
  const fmt = FORMAT_MAP[format] ?? format
  const loc = typeof locale === 'string' ? locale : (locale?.value ?? 'ru')
  const d = dayjs(value).locale(loc?.toString().startsWith('ru') ? 'ru' : 'en')
  return d.isValid() ? d.format(fmt) : String(value)
}

