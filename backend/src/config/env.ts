import 'dotenv/config'
import { z } from 'zod'

/**
 * Toda variável de ambiente passa por aqui. Se faltar alguma ou vier com valor
 * inválido, o processo morre no boot com a mensagem certa, em vez de quebrar
 * em produção na primeira requisição que precisar dela.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),

  DATABASE_URL: z.string().url('DATABASE_URL precisa ser uma URL de conexão válida'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET precisa de no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  /** URL do frontend. Entra no QR do certificado e nos links de e-mail. */
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:3333'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const erros = parsed.error.flatten().fieldErrors
  console.error('\nVariáveis de ambiente inválidas ou ausentes:\n')
  for (const [campo, mensagens] of Object.entries(erros)) {
    console.error(`  ${campo}: ${mensagens?.join(', ')}`)
  }
  console.error('\nConfira o arquivo .env (use .env.example como base).\n')
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
