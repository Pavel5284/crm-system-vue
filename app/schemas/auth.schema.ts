import { z } from 'zod'
import { createEmailSchema, type TranslateFn } from './email.schema'
import { createPasswordSchema } from './password.schema'

export type { TranslateFn } from './email.schema'

export interface RegisterFormValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Зеркало backend RegisterDto (apps/api-gateway/.../auth/dto/register.dto.ts):
// email — trim+lowercase, max 254; password 8..128; name trim, 1..100.
export const createRegisterSchema = (t: TranslateFn) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t('register.nameRequired'))
        .max(100, t('register.nameTooLong')),
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t('register.passwordsMismatch')),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: t('register.passwordsMismatch'),
    })

export interface LoginFormValues {
  email: string
  password: string
}

// Зеркало backend LoginDto (apps/api-gateway/.../auth/dto/login.dto.ts):
// email — trim+lowercase, max 254; пароль без MinLength (политику не
// раскрываем), только верхние лимиты. Одна ошибка за раз через superRefine.
export const createLoginSchema = (t: TranslateFn) =>
  z.object({
    email: createEmailSchema(t),
    password: createPasswordSchema(t, { minLength: false }),
  })
