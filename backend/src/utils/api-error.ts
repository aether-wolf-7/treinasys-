/**
 * Erro de aplicação com status HTTP e código estável.
 *
 * O `code` é o que o frontend usa para decidir o que fazer. A `message` é texto
 * para humano e pode mudar sem quebrar cliente nenhum.
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, ApiError)
  }

  static badRequest(message = 'Requisição inválida', code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, code, message, details)
  }

  static unauthorized(message = 'Não autenticado', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message)
  }

  static forbidden(message = 'Sem permissão para esta ação', code = 'FORBIDDEN') {
    return new ApiError(403, code, message)
  }

  static notFound(message = 'Recurso não encontrado', code = 'NOT_FOUND') {
    return new ApiError(404, code, message)
  }

  static conflict(message = 'Conflito com o estado atual do recurso', code = 'CONFLICT') {
    return new ApiError(409, code, message)
  }

  static tooManyRequests(message = 'Muitas tentativas. Tente novamente mais tarde', code = 'TOO_MANY_REQUESTS') {
    return new ApiError(429, code, message)
  }

  static internal(message = 'Erro interno do servidor', code = 'INTERNAL_ERROR') {
    return new ApiError(500, code, message)
  }
}
