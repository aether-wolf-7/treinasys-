import { prisma } from './prisma'

/**
 * Configuração global editável pelo Master (Módulo 14 do Plano Mestre).
 *
 * Os valores abaixo são o padrão de fábrica e valem enquanto a linha não existir
 * no banco. Ficam em cache curto porque o login lê isso a cada tentativa e não
 * faz sentido bater no banco toda vez para ler uma linha que quase nunca muda.
 */
export interface ConfiguracaoSistema {
  jwtExpiracaoHoras: number
  refreshExpiracaoDias: number
  maxTentativasLogin: number
  bloqueioMinutos: number
  senhaMinCaracteres: number
  senhaExigeMaiuscula: boolean
  senhaExigeNumero: boolean
  senhaExigeSimbolo: boolean
  alertaVencimentoDias: number
}

const PADRAO: ConfiguracaoSistema = {
  jwtExpiracaoHoras: 8,
  refreshExpiracaoDias: 30,
  maxTentativasLogin: 5,
  bloqueioMinutos: 30,
  senhaMinCaracteres: 8,
  senhaExigeMaiuscula: true,
  senhaExigeNumero: true,
  senhaExigeSimbolo: false,
  alertaVencimentoDias: 30,
}

const CACHE_MS = 60_000

let cache: { valor: ConfiguracaoSistema; expiraEm: number } | null = null

export async function obterConfiguracao(): Promise<ConfiguracaoSistema> {
  if (cache && cache.expiraEm > Date.now()) {
    return cache.valor
  }

  const registro = await prisma.systemConfig.findUnique({ where: { id: 'global' } })

  const valor: ConfiguracaoSistema = registro
    ? {
        jwtExpiracaoHoras: registro.jwtExpiracaoHoras,
        refreshExpiracaoDias: registro.refreshExpiracaoDias,
        maxTentativasLogin: registro.maxTentativasLogin,
        bloqueioMinutos: registro.bloqueioMinutos,
        senhaMinCaracteres: registro.senhaMinCaracteres,
        senhaExigeMaiuscula: registro.senhaExigeMaiuscula,
        senhaExigeNumero: registro.senhaExigeNumero,
        senhaExigeSimbolo: registro.senhaExigeSimbolo,
        alertaVencimentoDias: registro.alertaVencimentoDias,
      }
    : PADRAO

  cache = { valor, expiraEm: Date.now() + CACHE_MS }
  return valor
}

/** Chamar sempre que o Master salvar a configuração, para o cache não ficar velho. */
export function invalidarCacheConfiguracao(): void {
  cache = null
}
