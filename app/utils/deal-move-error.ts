import type { DealHighlightField } from '~/stores/deal-slide.store'

// Имена полей модели Deal (как их возвращает бэкенд в requiredFields)
// в ключи подсветки слайдовера.
const FIELD_MAP: Record<string, DealHighlightField> = {
  company: 'company',
  description: 'description',
  contactName: 'contact',
  contactPhone: 'contact',
  responsibleUserId: 'responsible',
  deadline: 'deadline',
}

// Подписи полей для тостов (ключи i18n).
const FIELD_LABEL_KEYS: Record<string, string> = {
  company: 'kanban.slideover.company',
  description: 'kanban.slideover.descriptionLabel',
  contactName: 'kanban.slideover.contactName',
  contactPhone: 'kanban.slideover.contactPhone',
  responsibleUserId: 'kanban.slideover.responsible',
  deadline: 'kanban.slideover.deadline',
}

const STAGE_IDS = ['todo', 'to-be-agreed', 'in-progress', 'produced', 'done']

const ROLE_KEYS: Record<string, string> = {
  ADMIN: 'roles.admin',
  MANAGER: 'roles.manager',
  USER: 'roles.user',
  TECHNOLOGIST: 'roles.technologist',
  LOGIST: 'roles.logist',
}

// Из сообщения вида
// '... заполните обязательные поля: company, description'
// вытаскивает ключи подсветки. Для остальных ошибок (роль, правило) — [].
export function parseMissingDealFields(message: string): DealHighlightField[] {
  const match = message.match(/обязательные поля:\s*(.+)/i)
  if (!match?.[1]) return []
  const fields = match[1]
    .split(',')
    .map((s) => s.trim())
    .map((name) => FIELD_MAP[name])
    .filter((f): f is DealHighlightField => !!f)
  return [...new Set(fields)]
}

// Человекочитаемый текст ошибки переноса для тоста:
//   '... из стадии "to-be-agreed" в стадию "in-progress" ... поля: responsibleUserId, deadline'
// → '... из стадии «На согласовании» в стадию «В производстве» ... поля: Ответственный, Дедлайн'.
// Не-деловые сообщения возвращает как есть.
export function humanizeDealError(message: string, t: (key: string) => string): string {
  if (!/стади|обязательные поля|запрещён|не найдена/i.test(message)) return message
  let out = message
  for (const id of STAGE_IDS) {
    out = out.split(`"${id}"`).join(`«${t('kanban.status.' + id)}»`)
  }
  for (const [code, key] of Object.entries(ROLE_KEYS)) {
    out = out.split(`"${code}"`).join(t(key))
  }
  out = out.replace(/обязательные поля:\s*(.+)/i, (_m, list: string) => {
    const names = list
      .split(',')
      .map((s) => s.trim())
      .map((name) => (FIELD_LABEL_KEYS[name] ? t(FIELD_LABEL_KEYS[name] as string) : name))
    return `обязательные поля: ${names.join(', ')}`
  })
  return out
}
