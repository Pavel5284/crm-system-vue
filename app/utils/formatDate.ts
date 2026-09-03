import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

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
): string => {
  if (!value) return '—'
  const fmt = FORMAT_MAP[format] ?? format
  const d = dayjs(value)
  return d.isValid() ? d.format(fmt) : String(value)
}
