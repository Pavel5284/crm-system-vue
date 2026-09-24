import { z } from 'zod'
import { isValidEmailFormat } from '~/utils/validation'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

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
      email: z
        .string()
        .trim()
        .superRefine((v, ctx) => {
          // Одна ошибка за раз: пусто → enterEmail, иначе длина/формат.
          if (!v) {
            ctx.addIssue({ code: 'custom', message: t('register.enterEmail') })
            return
          }
          if (v.length > 254) {
            ctx.addIssue({ code: 'custom', message: t('register.emailTooLong') })
            return
          }
          if (!isValidEmailFormat(v)) {
            ctx.addIssue({ code: 'custom', message: t('register.invalidEmail') })
          }
        }),
      password: z
        .string()
        .min(8, t('register.passwordTooShort'))
        .max(128, t('register.passwordTooLong')),
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
    email: z
      .string()
      .trim()
      .superRefine((v, ctx) => {
        if (!v) {
          ctx.addIssue({ code: 'custom', message: t('login.enterEmail') })
          return
        }
        if (v.length > 254) {
          ctx.addIssue({ code: 'custom', message: t('login.emailTooLong') })
          return
        }
        if (!isValidEmailFormat(v)) {
          ctx.addIssue({ code: 'custom', message: t('login.invalidEmail') })
        }
      }),
    password: z
      .string()
      .superRefine((v, ctx) => {
        if (!v) {
          ctx.addIssue({ code: 'custom', message: t('login.passwordRequired') })
          return
        }
        if (v.length > 128) {
          ctx.addIssue({ code: 'custom', message: t('login.passwordTooLong') })
        }
      }),
  })
