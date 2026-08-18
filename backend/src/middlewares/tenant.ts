import type { NextFunction, Request, Response } from 'express'
import { Role } from '@prisma/client'
import { ApiError } from '../utils/api-error'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resolve a qual empresa a requisição pertence e grava em `req.tenantId`.
 *
 * Esta é a peça central do isolamento. A regra é curta de propósito:
 *
 *   - Perfis de empresa (ADMIN, GESTOR, INSTRUTOR, COLABORADOR) ficam presos ao
 *     tenant que está no próprio registro do usuário. O cliente NUNCA escolhe.
 *     Nenhum header, query string ou campo de body influencia esse valor, porque
 *     é exatamente por aí que vazamento entre empresas costuma entrar.
 *
 *   - MASTER é o único perfil global. Ele pode apontar para uma empresa via
 *     header `x-tenant-id` quando quer operar dentro dela. Sem o header, fica em
 *     escopo global e `req.tenantId` continua indefinido, o que só as rotas de
 *     painel Master aceitam.
 */
export function resolverTenant(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.auth

  if (!auth) {
    throw ApiError.unauthorized()
  }

  if (auth.role === Role.MASTER) {
    const header = req.header('x-tenant-id')
    const alvo = header?.trim()

    if (alvo) {
      if (!UUID_REGEX.test(alvo)) {
        throw ApiError.badRequest('Identificador de empresa inválido', 'TENANT_INVALIDO')
      }
      req.tenantId = alvo
    }

    return next()
  }

  if (!auth.tenantId) {
    throw ApiError.forbidden('Usuário sem empresa vinculada', 'SEM_TENANT')
  }

  req.tenantId = auth.tenantId
  next()
}

/**
 * Para rotas de negócio, que não fazem sentido fora de uma empresa.
 * Colocar depois de `resolverTenant`.
 */
export function exigirTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    throw ApiError.badRequest(
      'Esta operação exige uma empresa. Informe o header x-tenant-id',
      'TENANT_OBRIGATORIO',
    )
  }
  next()
}

/**
 * Usado dentro dos services para pegar o tenant já garantido e tipado como string.
 * Se alguém esquecer o `exigirTenant` na rota, estoura aqui em vez de rodar uma
 * query sem filtro de empresa.
 */
export function tenantDaRequisicao(req: Request): string {
  if (!req.tenantId) {
    throw ApiError.forbidden('Contexto de empresa não resolvido', 'SEM_TENANT')
  }
  return req.tenantId
}
