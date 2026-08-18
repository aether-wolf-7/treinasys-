import type { NextFunction, Request, Response } from 'express'
import { Role } from '@prisma/client'
import { ApiError } from '../utils/api-error'
import { temNivelMinimo } from '../modules/auth/roles'

/**
 * Exige um nível mínimo de perfil. Como a hierarquia é numérica, `autorizar(Role.GESTOR)`
 * libera GESTOR, ADMIN e MASTER de uma vez.
 *
 * Isto é autorização de rota. Não substitui a checagem de posse do recurso dentro
 * do service: um GESTOR passa aqui, mas ainda não pode mexer na equipe de outro.
 */
export function autorizar(nivelMinimo: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw ApiError.unauthorized()
    }

    if (!temNivelMinimo(req.auth.role, nivelMinimo)) {
      throw ApiError.forbidden('Seu perfil não tem permissão para esta ação')
    }

    next()
  }
}

/** Restringe a rota a perfis específicos, quando "nível mínimo" não descreve a regra. */
export function autorizarPerfis(...perfis: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw ApiError.unauthorized()
    }

    if (!perfis.includes(req.auth.role)) {
      throw ApiError.forbidden('Seu perfil não tem permissão para esta ação')
    }

    next()
  }
}

export const apenasMaster = autorizarPerfis(Role.MASTER)
