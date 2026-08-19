export type Perfil = 'MASTER' | 'ADMIN' | 'GESTOR' | 'INSTRUTOR' | 'COLABORADOR'

/** Hierarquia do Plano Mestre. Espelha NIVEL_POR_ROLE do backend. */
export const NIVEL: Record<Perfil, number> = {
  MASTER: 5,
  ADMIN: 4,
  GESTOR: 3,
  INSTRUTOR: 2,
  COLABORADOR: 1,
}

export const NOME_DO_PERFIL: Record<Perfil, string> = {
  MASTER: 'Master',
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  INSTRUTOR: 'Instrutor',
  COLABORADOR: 'Colaborador',
}

export interface Usuario {
  id: string
  nome: string
  email: string
  role: Perfil
  tenantId: string | null
  precisaTrocarSenha: boolean
}

export interface Empresa {
  id: string
  nome: string
  slug: string
  plano: string
  status: string
  logoUrl: string | null
}

export interface PerfilCompleto {
  id: string
  nome: string
  email: string
  cpf: string | null
  telefone: string | null
  cargo: string | null
  role: Perfil
  tenantId: string | null
  precisaTrocarSenha: boolean
  ultimoLoginEm: string | null
  tenant: Empresa | null
  team: { id: string; nome: string } | null
}

export interface RespostaLogin {
  accessToken: string
  refreshToken: string
  expiresIn: number
  usuario: Usuario
}

export function temNivelMinimo(perfil: Perfil, minimo: Perfil): boolean {
  return NIVEL[perfil] >= NIVEL[minimo]
}
