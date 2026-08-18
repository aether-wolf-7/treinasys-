import type { Response } from 'express'

/**
 * Envelope de resposta definido no Plano Mestre: { success, data, error, meta }.
 * Toda rota responde por aqui, para o frontend nunca precisar adivinhar o formato.
 */
export interface ResponseMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponseBody<T> {
  success: boolean
  data: T | null
  error: ApiErrorBody | null
  meta?: ResponseMeta
}

export function sendOk<T>(res: Response, data: T, meta?: ResponseMeta): Response {
  const body: ApiResponseBody<T> = { success: true, data, error: null }
  if (meta) body.meta = meta
  return res.status(200).json(body)
}

export function sendCreated<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data, error: null } satisfies ApiResponseBody<T>)
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send()
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const error: ApiErrorBody = { code, message }
  if (details !== undefined) error.details = details
  return res.status(statusCode).json({ success: false, data: null, error } satisfies ApiResponseBody<never>)
}

/** Monta o bloco `meta` das listagens paginadas. */
export function buildMeta(page: number, limit: number, total: number): ResponseMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}
