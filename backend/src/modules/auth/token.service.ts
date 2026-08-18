import crypto from 'node:crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../../config/env'

export interface AccessTokenClaims {
  sub: string
  tenantId: string | null
  role: Role
  jti: string
  exp: number
  iat: number
}

export interface AccessTokenGerado {
  token: string
  jti: string
  expiraEm: Date
}

/**
 * Gera o access token.
 *
 * O `jti` é obrigatório: é ele que permite revogar a sessão no logout, gravando
 * o identificador em `revoked_tokens`. Sem isso um JWT roubado valeria até expirar.
 */
export function assinarAccessToken(dados: {
  userId: string
  tenantId: string | null
  role: Role
}): AccessTokenGerado {
  const jti = crypto.randomUUID()

  const token = jwt.sign({ tenantId: dados.tenantId, role: dados.role }, env.JWT_SECRET, {
    subject: dados.userId,
    jwtid: jti,
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions)

  const decodificado = jwt.decode(token) as { exp: number } | null
  if (!decodificado?.exp) {
    throw new Error('Não foi possível ler a expiração do token recém-gerado')
  }

  return { token, jti, expiraEm: new Date(decodificado.exp * 1000) }
}

export function verificarAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims
}

/**
 * Refresh token é opaco, não é JWT. Só o hash SHA-256 vai para o banco, então
 * um vazamento da tabela não entrega sessão nenhuma.
 */
export function gerarRefreshToken(): { token: string; hash: string; expiraEm: Date } {
  const token = crypto.randomBytes(48).toString('base64url')
  return {
    token,
    hash: hashDeToken(token),
    expiraEm: new Date(Date.now() + parseDuracaoParaMs(env.REFRESH_TOKEN_EXPIRES_IN)),
  }
}

export function hashDeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Converte "30d", "8h", "15m", "45s" em milissegundos. */
export function parseDuracaoParaMs(valor: string): number {
  const match = /^(\d+)([smhd])$/.exec(valor.trim())
  const quantidade = match?.[1]
  const unidade = match?.[2]

  if (!quantidade || !unidade) {
    throw new Error(`Duração inválida: "${valor}". Use formatos como 30d, 8h, 15m ou 45s.`)
  }

  const multiplicadores: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }

  const multiplicador = multiplicadores[unidade]
  if (!multiplicador) {
    throw new Error(`Unidade de duração desconhecida: "${unidade}"`)
  }

  return Number(quantidade) * multiplicador
}
