import { Role } from '@prisma/client'
import { prisma } from '../../lib/prisma'

export interface ResumoDoPainel {
  usuariosAtivos: number
  motoristas: number
  gestores: number
  instrutores: number
  equipes: number
  treinamentosPublicados: number
  turmasAgendadas: number
  matriculasEmAndamento: number
  concluidosNoMes: number
  certificadosValidos: number
  vencendoEm30Dias: number
  vencidos: number
}

/**
 * Resumo do painel, sempre no escopo de UMA empresa.
 *
 * Todas as contagens filtram por tenantId. Nao existe caminho aqui que devolva
 * numero de outra empresa: o tenantId vem do middleware, nunca do cliente.
 */
export async function obterResumo(tenantId: string): Promise<ResumoDoPainel> {
  const agora = new Date()
  const em30Dias = new Date(agora.getTime() + 30 * 86_400_000)
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [
    usuariosAtivos,
    motoristas,
    gestores,
    instrutores,
    equipes,
    treinamentosPublicados,
    turmasAgendadas,
    matriculasEmAndamento,
    concluidosNoMes,
    certificadosValidos,
    vencendoEm30Dias,
    vencidos,
  ] = await Promise.all([
    prisma.user.count({ where: { tenantId, ativo: true, deletedAt: null } }),
    prisma.user.count({ where: { tenantId, ativo: true, deletedAt: null, role: Role.COLABORADOR } }),
    prisma.user.count({ where: { tenantId, ativo: true, deletedAt: null, role: Role.GESTOR } }),
    prisma.user.count({ where: { tenantId, ativo: true, deletedAt: null, role: Role.INSTRUTOR } }),
    prisma.team.count({ where: { tenantId, deletedAt: null } }),
    prisma.training.count({ where: { tenantId, status: 'PUBLICADO', deletedAt: null } }),
    prisma.turma.count({ where: { tenantId, status: 'AGENDADA' } }),
    prisma.enrollment.count({ where: { tenantId, status: 'EM_ANDAMENTO' } }),
    prisma.completion.count({ where: { tenantId, concluidoEm: { gte: inicioDoMes } } }),
    prisma.certificate.count({ where: { tenantId, status: 'VALIDO' } }),
    prisma.certificate.count({
      where: { tenantId, status: 'VALIDO', validoAte: { gte: agora, lte: em30Dias } },
    }),
    prisma.certificate.count({ where: { tenantId, validoAte: { lt: agora } } }),
  ])

  return {
    usuariosAtivos,
    motoristas,
    gestores,
    instrutores,
    equipes,
    treinamentosPublicados,
    turmasAgendadas,
    matriculasEmAndamento,
    concluidosNoMes,
    certificadosValidos,
    vencendoEm30Dias,
    vencidos,
  }
}
