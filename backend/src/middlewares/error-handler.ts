import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { env } from '../config/env'
import { logger } from '../lib/logger'
import { ApiError } from '../utils/api-error'
import { sendError } from '../utils/response'

/** 404 para rota inexistente, no mesmo envelope das demais respostas. */
export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, 404, 'ROTA_NAO_ENCONTRADA', `Rota não encontrada: ${req.method} ${req.originalUrl}`)
}

/**
 * Tratador central de erros.
 *
 * Regra que não se quebra: em produção, erro inesperado vira mensagem genérica.
 * Stack trace e detalhe de banco ficam no log do servidor, nunca na resposta,
 * porque mensagem de erro de ORM entrega estrutura de tabela para quem estiver
 * sondando a API.
 */
export function errorHandler(
  erro: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (erro instanceof ApiError) {
    if (erro.statusCode >= 500) {
      logger.error({ err: erro, rota: req.originalUrl }, erro.message)
    }
    return sendError(res, erro.statusCode, erro.code, erro.message, erro.details)
  }

  if (erro instanceof ZodError) {
    return sendError(res, 400, 'VALIDACAO', 'Dados inválidos', erro.flatten().fieldErrors)
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    switch (erro.code) {
      case 'P2002': {
        const alvo = (erro.meta?.['target'] as string[] | undefined)?.join(', ')
        return sendError(
          res,
          409,
          'REGISTRO_DUPLICADO',
          alvo ? `Já existe um registro com este valor: ${alvo}` : 'Registro duplicado',
        )
      }
      case 'P2025':
        return sendError(res, 404, 'NAO_ENCONTRADO', 'Registro não encontrado')
      case 'P2003':
        return sendError(res, 409, 'VINCULO_INVALIDO', 'Registro vinculado a outro que não existe')
      default:
        break
    }
  }

  logger.error({ err: erro, rota: req.originalUrl, metodo: req.method }, 'Erro não tratado')

  return sendError(
    res,
    500,
    'INTERNAL_ERROR',
    env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : erro instanceof Error
        ? erro.message
        : 'Erro interno do servidor',
  )
}
