import type { Request } from 'express'
import { prisma } from './prisma'
import { logger } from './logger'

export interface EntradaAuditoria {
  tenantId?: string | null
  userId?: string | null
  acao: string
  entidade: string
  entidadeId?: string | null
  antes?: unknown
  depois?: unknown
  ip?: string | null
  userAgent?: string | null
}

/** Campos que nunca podem ser gravados no log de auditoria (LGPD). */
const CAMPOS_SENSIVEIS = new Set([
  'senha',
  'senhaHash',
  'senha_hash',
  'novaSenha',
  'senhaAtual',
  'cpf',
  'token',
  'tokenHash',
  'refreshToken',
])

/**
 * Grava uma entrada no log imutável de auditoria.
 *
 * Nunca derruba a operação principal: se a auditoria falhar, o erro vai para o
 * log da aplicação e o fluxo do usuário continua. Auditoria quebrada é problema
 * de operação, não motivo para impedir um motorista de concluir o treinamento.
 */
export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entrada.tenantId ?? null,
        userId: entrada.userId ?? null,
        acao: entrada.acao,
        entidade: entrada.entidade,
        entidadeId: entrada.entidadeId ?? null,
        antes: sanitizar(entrada.antes),
        depois: sanitizar(entrada.depois),
        ip: entrada.ip ?? null,
        userAgent: entrada.userAgent ?? null,
      },
    })
  } catch (erro) {
    logger.error({ err: erro, acao: entrada.acao }, 'Falha ao gravar log de auditoria')
  }
}

/** Remove campos sensíveis antes de persistir o antes/depois. */
function sanitizar(valor: unknown): object | undefined {
  if (valor === null || valor === undefined) return undefined
  if (typeof valor !== 'object') return { valor: String(valor) }

  const entrada = valor as Record<string, unknown>
  const saida: Record<string, unknown> = {}

  for (const [chave, item] of Object.entries(entrada)) {
    saida[chave] = CAMPOS_SENSIVEIS.has(chave) ? '[REMOVIDO]' : item
  }

  return saida
}

/** Extrai IP e user-agent da requisição, já prontos para a auditoria. */
export function origemDaRequisicao(req: Request): { ip: string | null; userAgent: string | null } {
  return {
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  }
}
