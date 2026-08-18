import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodTypeAny } from 'zod'
import { ApiError } from '../utils/api-error'

export interface EsquemasDeValidacao {
  body?: ZodTypeAny
  params?: ZodTypeAny
  query?: ZodTypeAny
}

/**
 * Valida entrada com Zod antes de chegar no controller.
 *
 * Detalhe do Express 5: `req.query` virou getter e não aceita reatribuição.
 * Por isso o resultado da query validada vai para `req.validQuery`, e não de
 * volta para `req.query`.
 */
export function validar(esquemas: EsquemasDeValidacao) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (esquemas.body) {
        req.body = esquemas.body.parse(req.body)
      }
      if (esquemas.params) {
        req.params = esquemas.params.parse(req.params)
      }
      if (esquemas.query) {
        req.validQuery = esquemas.query.parse(req.query) as Record<string, unknown>
      }
      next()
    } catch (erro) {
      if (erro instanceof ZodError) {
        throw ApiError.badRequest('Dados inválidos', 'VALIDACAO', formatarErrosZod(erro))
      }
      throw erro
    }
  }
}

/** Achata o erro do Zod em { campo: [mensagens] }, que é o que o frontend consome. */
function formatarErrosZod(erro: ZodError): Record<string, string[]> {
  const saida: Record<string, string[]> = {}

  for (const problema of erro.issues) {
    const campo = problema.path.join('.') || '_'
    const existente = saida[campo]
    if (existente) {
      existente.push(problema.message)
    } else {
      saida[campo] = [problema.message]
    }
  }

  return saida
}
