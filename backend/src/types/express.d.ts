import type { Role } from '@prisma/client'

/** Identidade do requisitante, montada pelo middleware `authenticate`. */
export interface AuthContext {
  userId: string
  /** Nulo somente para MASTER, que é global. */
  tenantId: string | null
  role: Role
  nivel: number
  /** Identificador único do access token, conferido contra `revoked_tokens`. */
  jti: string
  bypassAntiSkip: boolean
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext
      /**
       * Tenant efetivo da requisição, resolvido pelo middleware `tenant`.
       * Toda query de negócio filtra por este valor.
       */
      tenantId?: string
      /** Query string validada pelo middleware `validar` (Express 5 não deixa reatribuir req.query). */
      validQuery?: Record<string, unknown>
    }
  }
}
