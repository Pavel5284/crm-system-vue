export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export type AvatarFileProblem = 'tooLarge' | 'notImage'

/** Проверка файла аватара (лимит 2MB, только изображения). Код — маппится на строки вызывающей стороной. */
export const validateAvatarFile = (file: File): AvatarFileProblem | null => {
  if (file.size > AVATAR_MAX_BYTES) return 'tooLarge'
  if (!file.type.startsWith('image/')) return 'notImage'
  return null
}

/** Чтение файла в data URL для превью/отправки. */
export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('avatar-read-error'))
    reader.readAsDataURL(file)
  })

/** Инициалы из имени: «Иван Петров» -> «ИП», «Менеджер» -> «МЕ», пусто -> «?». */
export const getInitials = (name: string | null | undefined): string => {
  const parts = String(name ?? '').split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
}
