// zod иногда отдает объект { message }, приводим к строке
export const formatFieldError = (err: unknown): string => {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  try {
    return JSON.stringify(err)
  }
  catch {
    return String(err)
  }
}

export const formatFieldErrors = (errors: unknown[]): string =>
  [...new Set(errors.map(formatFieldError))].join(', ')
