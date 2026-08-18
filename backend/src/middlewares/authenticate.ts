import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/api-error'
import { nivelDe } from '../modules/auth/roles'
import { verificarAccessToken } from '../modules/auth/token.service'

/**
 * Valida o access token e monta `req.auth`.
 *
 * São duas conferências além da assinatura, e as duas existem por um motivo:
 *
 * 1. `revoked_tokens` — o logout precisa matar a sessão de verdade. Sem essa
 *    lista, um token roubado continuaria válido até expirar sozinho.
 * 2. estado do usuário — perfil e situação são lidos do banco a cada requisição,
 *    não do token. Se o RH desativa alguém ou rebaixa o perfil, vale na hora,
 *    e não só quando o token dele expirar.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token de acesso não informado', 'TOKEN_AUSENTE')
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    throw ApiError.unauthorized('Token de acesso não informado', 'TOKEN_AUSENTE')
  }

  let claims
  try {
    claims = verificarAccessToken(token)
  } catch (erro) {
    if (erro instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Sessão expirada. Faça login novamente', 'TOKEN_EXPIRADO')
    }
    throw ApiError.unauthorized('Token de acesso inválido', 'TOKEN_INVALIDO')
  }

  const [revogado, usuario] = await Promise.all([
    prisma.revokedToken.findUnique({
      where: { jti: claims.jti },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        tenantId: true,
        role: true,
        ativo: true,
        deletedAt: true,
        bypassAntiSkip: true,
        bloqueadoAte: true,
        senhaAlteradaEm: true,
      },
    }),
  ])

  if (revogado) {
    throw ApiError.unauthorized('Sessão encerrada. Faça login novamente', 'TOKEN_REVOGADO')
  }

  if (!usuario || usuario.deletedAt) {
    throw ApiError.unauthorized('Usuário não encontrado', 'USUARIO_NAO_ENCONTRADO')
  }

  if (!usuario.ativo) {
    throw ApiError.forbidden('Usuário inativo. Procure o administrador da sua empresa', 'USUARIO_INATIVO')
  }

  if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
    throw ApiError.forbidden('Conta temporariamente bloqueada', 'CONTA_BLOQUEADA')
  }

  // Token emitido antes da ultima troca de senha nao vale mais. E assim que
  // "redefinir senha" derruba de verdade as sessoes que ja estavam abertas.
  if (usuario.senhaAlteradaEm && claims.iat * 1000 < usuario.senhaAlteradaEm.getTime()) {
    throw ApiError.unauthorized('Senha alterada. Faca login novamente', 'TOKEN_INVALIDO')
  }

  req.auth = {
    userId: usuario.id,
    tenantId: usuario.tenantId,
    role: usuario.role,
    nivel: nivelDe(usuario.role),
    jti: claims.jti,
    bypassAntiSkip: usuario.bypassAntiSkip,
  }

  next()
}
