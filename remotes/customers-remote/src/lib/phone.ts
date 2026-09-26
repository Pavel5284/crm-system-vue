export const PHONE_MAX_DIGITS = 15

// Зеркало host `app/utils/phone.ts`: remote собирается независимо
// и не может импортировать утилиты хоста.
// В поле можно вводить цифры, +, пробел, скобки, тире.
// Буквы и остальные спецсимволы не печатаются (режутся и на ввод, и на keydown).
// Пустое поле остаётся пустым — видна маска-плейсхолдер.
// '+' ставится автоматически вместе с первым символом:
// набрал '9' -> '+9', сперва нажал '+' -> '+' и далее цифры.
export const sanitizePhoneDisplay = (raw: string | null | undefined): string => {
  const cleaned = String(raw ?? '').replace(/[^0-9+\s()-]/g, '')
  if (!cleaned) return ''
  const withoutPlus = cleaned.replace(/\+/g, '')
  if (!withoutPlus) return '+'
  // '+' всегда один и всегда спереди — ставится автоматически
  return `+${withoutPlus}`
}

// Режем лишние цифры (свыше 15), форматирование сохраняем
export const truncatePhoneDigits = (display: string): string => {
  let digits = 0
  let out = ''
  for (const ch of display) {
    if (/\d/.test(ch)) {
      digits += 1
      if (digits > PHONE_MAX_DIGITS) continue
    }
    out += ch
  }
  return out
}

export const normalizePhone = (raw: string | null | undefined): string => {
  return truncatePhoneDigits(sanitizePhoneDisplay(raw))
}

// Перед отправкой на бэк скобки/пробелы/тире удаляются, уходит +цифры
export const phoneToPayload = (v: string): string | null => {
  const digits = (v ?? '').replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS)
  return digits ? `+${digits}` : null
}

// Буквы/спецсимволы не вводятся вообще (даже не мигают в инпуте).
// Служебные клавиши и Ctrl/Cmd-комбинации пропускаем.
const PHONE_ALLOWED_KEY_RE = /[0-9+\s()-]/
export const handlePhoneKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1) return
  if (!PHONE_ALLOWED_KEY_RE.test(e.key)) e.preventDefault()
}

export const isPhoneDisplayValid = (v: string): boolean => {
  const trimmed = (v ?? '').trim()
  if (!trimmed || trimmed === '+') return true
  if (/[^+\d\s()-]/.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= PHONE_MAX_DIGITS
}
