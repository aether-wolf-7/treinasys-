import { Role } from '@prisma/client'

/**
 * Hierarquia de perfis do Plano Mestre. O número é o que vale nas comparações:
 * uma rota exige um nível mínimo e qualquer perfil igual ou acima passa.
 */
export const NIVEL_POR_ROLE: Record<Role, number> = {
  MASTER: 5,
  ADMIN: 4,
  GESTOR: 3,
  INSTRUTOR: 2,
  COLABORADOR: 1,
}

export function nivelDe(role: Role): number {
  return NIVEL_POR_ROLE[role]
}

export function temNivelMinimo(role: Role, minimo: Role): boolean {
  return nivelDe(role) >= nivelDe(minimo)
}

/** MASTER é o único perfil global: enxerga todos os tenants e não pertence a nenhum. */
export function ehMaster(role: Role): boolean {
  return role === Role.MASTER
}
