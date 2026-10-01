// Отображаемые данные собеседника: UUID-имена — заглушки бэкенда,
// показываем email; инициалы — для аватара без фото.
export const isUuid = (s: string | null | undefined): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((s ?? '').trim())

export const displayName = (u: { name: string; email: string }): string => {
  if (!u?.name || isUuid(u.name)) return u.email
  return u.name
}

export const getInitials = (name: string, email: string): string => {
  const n = (isUuid(name) ? '' : name)?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
  }
  return email?.[0]?.toUpperCase() ?? '?'
}
