import crypto from 'node:crypto'
import type { Request } from 'express'
import rateLimit from 'express-rate-limit'

/**
 * Rate limiting pensado para o cenário real deste produto.
 *
 * O detalhe que muda tudo: os motoristas de uma transportadora fazem login do
 * MESMO IP. Todo mundo no pátio, no mesmo wi-fi, no início do turno. Se o limite
 * for por IP puro e apertado, o primeiro punhado de motoristas consome a cota e
 * os demais levam 429 sem ter feito nada de errado. Já aconteceu de derrubar
 * plataforma inteira por isso.
 *
 * Então a divisão é:
 *
 *   - força bruta contra UMA conta      -> limite por identificador + bloqueio
 *                                          de conta no banco (5 tentativas)
 *   - varredura de MUITAS contas        -> limite por IP, mas folgado o bastante
 *                                          para um pátio inteiro caber
 *   - uso normal já autenticado         -> limite por usuário, não por IP
 */

const QUINZE_MINUTOS = 15 * 60 * 1000

function corpoDaResposta(mensagem: string) {
  return {
    success: false,
    data: null,
    error: { code: 'TOO_MANY_REQUESTS', message: mensagem },
  }
}

/**
 * Agrupa IPv6 por /64. Sem isso, quem tem um bloco IPv6 gera uma chave nova a
 * cada requisição e passa direto pelo limite.
 */
function chaveDeIp(ip: string | undefined): string {
  if (!ip) return 'ip:desconhecido'
  if (ip.includes(':')) {
    return `ip:${ip.split(':').slice(0, 4).join(':')}::/64`
  }
  return `ip:${ip}`
}

/**
 * Chave do tráfego geral: se a requisição traz Bearer token, limita por sessão;
 * senão, por IP. É isso que impede que 50 motoristas do mesmo pátio, salvando
 * progresso de treinamento ao mesmo tempo, estourem a cota uns dos outros.
 */
function chaveDeUsuarioOuIp(req: Request): string {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7).trim()
    if (token) {
      return `sessao:${crypto.createHash('sha256').update(token).digest('hex').slice(0, 32)}`
    }
  }
  return chaveDeIp(req.ip)
}

/** Tráfego geral da API. Generoso: o motor de treinamento salva progresso com frequência. */
export const limiteGlobal = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: chaveDeUsuarioOuIp,
  message: corpoDaResposta('Muitas requisições. Aguarde um instante e tente novamente'),
})

/**
 * Limite por conta nas rotas de credencial. Complementa o bloqueio de conta:
 * o bloqueio trata tentativa de senha, este trata volume de requisição.
 */
export const limitePorConta = rateLimit({
  windowMs: QUINZE_MINUTOS,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const corpo = req.body as { identificador?: string; email?: string } | undefined
    const conta = (corpo?.identificador ?? corpo?.email ?? '').trim().toLowerCase()
    return conta ? `conta:${conta}` : chaveDeIp(req.ip)
  },
  message: corpoDaResposta('Muitas tentativas para esta conta. Aguarde alguns minutos'),
})

/**
 * Teto por IP nas rotas de credencial: pega varredura de muitas contas a partir
 * de uma origem só. O valor é folgado de propósito, para caber um pátio inteiro
 * atrás do mesmo IP sem atrapalhar ninguém.
 */
export const limitePorIpNasCredenciais = rateLimit({
  windowMs: QUINZE_MINUTOS,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => chaveDeIp(req.ip),
  message: corpoDaResposta('Muitas tentativas a partir desta rede. Aguarde alguns minutos'),
})
