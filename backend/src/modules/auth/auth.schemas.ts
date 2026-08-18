import { z } from 'zod'

/**
 * Login aceita e-mail ou CPF no mesmo campo. Motorista muitas vezes não tem
 * e-mail, e obrigar dois campos separados só cria erro de digitação em campo.
 */
export const loginSchema = z.object({
  identificador: z
    .string({ required_error: 'Informe o e-mail ou CPF' })
    .trim()
    .min(1, 'Informe o e-mail ou CPF'),
  senha: z.string({ required_error: 'Informe a senha' }).min(1, 'Informe a senha'),
})

export const renovarSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token não informado' }).min(1),
})

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
})

export const esqueciSenhaSchema = z.object({
  email: z.string({ required_error: 'Informe o e-mail' }).trim().toLowerCase().email('E-mail inválido'),
})

export const redefinirSenhaSchema = z.object({
  token: z.string({ required_error: 'Token não informado' }).min(1),
  novaSenha: z.string({ required_error: 'Informe a nova senha' }).min(1),
})

export const trocarSenhaSchema = z.object({
  senhaAtual: z.string({ required_error: 'Informe a senha atual' }).min(1),
  novaSenha: z.string({ required_error: 'Informe a nova senha' }).min(1),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RenovarInput = z.infer<typeof renovarSchema>
export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>
export type TrocarSenhaInput = z.infer<typeof trocarSenhaSchema>
