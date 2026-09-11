export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/**
 * Тело ошибки из `AllExceptionsFilter` (бэкенд нормализует всё к `string | string[]`):
 * - доменные `throw new XException('текст')` → `string` (см. `BackendKnownMessage`)
 * - `ValidationPipe` → `string[]` (плоский список constraint-сообщений)
 * - guard-дефолты (`Unauthorized`), 429/500 → `string`
 */
export interface BackendErrorResponse<TMessage extends string = string> {
  success: false
  statusCode: number
  timestamp: string
  path: string
  message: TMessage | TMessage[]
  error?: string
}

/** Type-guard вместо `as`: проверяет, что значение — объект, к полям можно обращаться. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Безопасное чтение поля без `as`: для любого значения возвращает `unknown`. */
export function readField(value: unknown, key: string): unknown {
  if (!isRecord(value)) return undefined
  return value[key]
}

/** Ошибка бэкенда из AllExceptionsFilter: `{ success: false, statusCode, message, ... }`. */
export function isBackendErrorResponse<TMessage extends string = string>(
  value: unknown,
): value is BackendErrorResponse<TMessage> {
  if (!isRecord(value)) return false
  if (value.success !== false) return false
  return 'message' in value
}

/** Успешный ответ-обёртка `{ success: true, data }`. */
export function isSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  if (!isRecord(value)) return false
  if (value.success !== true) return false
  return 'data' in value
}

/** Достаёт HTTP-статус из любого брошенного значения без `as`. */
export function getStatusCode(error: unknown): number | undefined {
  const status = readField(error, 'statusCode')
  return typeof status === 'number' ? status : undefined
}

/**
 * Единственный тип ошибок, который бросает `apiFetch` (см. `~/utils/api`).
 * Дженерик `TMessage` — union точных текстов бэкенда для этого эндпоинта:
 *
 * ```ts
 * try {
 *   await loginApi(email, password)
 * } catch (error) {
 *   if (error instanceof ApiError && error.statusCode === 401) {
 *     error.message // string — читаемый текст для тоста
 *     error.envelope // BackendErrorResponse<LoginError> | null
 *   }
 * }
 * ```
 */
export class ApiError<TMessage extends string = string> extends Error {
  readonly statusCode: number | undefined
  readonly envelope: BackendErrorResponse<TMessage> | null

  constructor(message: string, options?: { statusCode?: number; envelope?: BackendErrorResponse<TMessage> | null }) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = options?.statusCode
    this.envelope = options?.envelope ?? null
  }
}
