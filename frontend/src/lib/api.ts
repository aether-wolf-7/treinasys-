/**
 * Cliente HTTP do TreinaSys.
 *
 * Decisao sobre guarda de token, que vale explicar:
 *
 *   - o ACCESS token fica so em memoria. Se algum script malicioso entrar na
 *     pagina, ele nao acha o token de acesso em localStorage esperando por ele.
 *   - o REFRESH token fica em localStorage, porque o motorista fecha o navegador
 *     no meio do treinamento e precisa voltar sem digitar senha de novo.
 *   - ao abrir a aplicacao, faz um refresh silencioso para reconstruir a sessao.
 *
 * O ideal seria cookie httpOnly, mas isso exige a API e o front no mesmo dominio
 * com CSRF tratado. Fica anotado para quando o dominio de producao estiver de pe.
 */

const BASE = '/api/v1'
const CHAVE_REFRESH = 'treinasys.refresh'

export interface CorpoErro {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface RespostaApi<T> {
  success: boolean
  data: T | null
  error: CorpoErro | null
  meta?: Record<string, unknown>
}

export class ErroApi extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, string[]>

  constructor(status: number, corpo: CorpoErro) {
    super(corpo.message)
    this.name = 'ErroApi'
    this.status = status
    this.code = corpo.code
    this.details = corpo.details
  }
}

let accessToken: string | null = null
let refreshEmAndamento: Promise<boolean> | null = null

export function definirSessao(tokens: { accessToken: string; refreshToken: string }): void {
  accessToken = tokens.accessToken
  localStorage.setItem(CHAVE_REFRESH, tokens.refreshToken)
}

export function limparSessao(): void {
  accessToken = null
  localStorage.removeItem(CHAVE_REFRESH)
}

export function temRefreshGuardado(): boolean {
  return Boolean(localStorage.getItem(CHAVE_REFRESH))
}

export function tokenAtual(): string | null {
  return accessToken
}

/**
 * Renova a sessao. Se varias requisicoes falharem por token expirado ao mesmo
 * tempo, todas aguardam a MESMA renovacao em vez de disparar uma cada, o que
 * quebraria a rotacao de refresh token do servidor.
 */
async function renovarSessao(): Promise<boolean> {
  if (refreshEmAndamento) return refreshEmAndamento

  refreshEmAndamento = (async () => {
    const guardado = localStorage.getItem(CHAVE_REFRESH)
    if (!guardado) return false

    try {
      const res = await fetch(BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: guardado }),
      })

      if (!res.ok) {
        limparSessao()
        return false
      }

      const corpo = (await res.json()) as RespostaApi<{ accessToken: string; refreshToken: string }>
      if (!corpo.data) {
        limparSessao()
        return false
      }

      definirSessao(corpo.data)
      return true
    } catch {
      return false
    } finally {
      refreshEmAndamento = null
    }
  })()

  return refreshEmAndamento
}

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  corpo?: unknown
  /** Interno: evita laco infinito quando o proprio refresh devolve 401. */
  jaRenovou?: boolean
}

export async function requisitar<T>(rota: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo, jaRenovou = false } = opcoes

  const res = await fetch(BASE + rota, {
    method: metodo,
    headers: {
      ...(corpo ? { 'content-type': 'application/json' } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
  })

  if (res.status === 204) {
    return undefined as T
  }

  const texto = await res.text()
  let json: RespostaApi<T> | null = null
  try {
    json = texto ? (JSON.parse(texto) as RespostaApi<T>) : null
  } catch {
    throw new ErroApi(res.status, {
      code: 'RESPOSTA_INVALIDA',
      message: 'O servidor devolveu uma resposta inesperada',
    })
  }

  if (res.ok) {
    return json?.data as T
  }

  // Token expirado: renova uma vez e repete a requisicao original.
  if (res.status === 401 && !jaRenovou && json?.error?.code === 'TOKEN_EXPIRADO') {
    const renovou = await renovarSessao()
    if (renovou) {
      return requisitar<T>(rota, { ...opcoes, jaRenovou: true })
    }
  }

  throw new ErroApi(
    res.status,
    json?.error ?? { code: 'ERRO_DESCONHECIDO', message: 'Nao foi possivel completar a operacao' },
  )
}

export const api = {
  get: <T>(rota: string) => requisitar<T>(rota),
  post: <T>(rota: string, corpo?: unknown) => requisitar<T>(rota, { metodo: 'POST', corpo }),
  patch: <T>(rota: string, corpo?: unknown) => requisitar<T>(rota, { metodo: 'PATCH', corpo }),
  delete: <T>(rota: string) => requisitar<T>(rota, { metodo: 'DELETE' }),
  renovarSessao,
}
