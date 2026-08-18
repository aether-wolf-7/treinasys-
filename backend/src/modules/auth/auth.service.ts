import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { registrarAuditoria } from '../../lib/audit'
import { obterConfiguracao, type ConfiguracaoSistema } from '../../lib/system-config'
import { ApiError } from '../../utils/api-error'
import { env } from '../../config/env'
import { assinarAccessToken, gerarRefreshToken, hashDeToken, parseDuracaoParaMs } from './token.service'

/** Custo do bcrypt. O Plano Mestre exige no mínimo 12. */
export const SALT_ROUNDS = 12

/**
 * Hash descartável usado só para igualar o tempo de resposta quando o usuário
 * não existe. Sem isso, "e-mail não cadastrado" responde bem mais rápido que
 * "senha errada", e dá para descobrir quem tem conta cronometrando a API.
 */
const HASH_FICTICIO = bcrypt.hashSync('usuario-inexistente-treinasys', SALT_ROUNDS)

export interface Origem {
  ip: string | null
  userAgent: string | null
}

export interface UsuarioAutenticado {
  id: string
  nome: string
  email: string
  role: Role
  tenantId: string | null
  precisaTrocarSenha: boolean
}

export interface ResultadoLogin {
  accessToken: string
  refreshToken: string
  expiresIn: number
  usuario: UsuarioAutenticado
}

export async function login(
  dados: { identificador: string; senha: string },
  origem: Origem,
): Promise<ResultadoLogin> {
  const config = await obterConfiguracao()
  const agora = new Date()

  const usuario = await buscarPorIdentificador(dados.identificador)

  if (!usuario) {
    // Gasta o mesmo tempo de um bcrypt real antes de responder.
    await bcrypt.compare(dados.senha, HASH_FICTICIO)
    await registrarTentativa(dados.identificador, null, null, false, 'USUARIO_NAO_ENCONTRADO', origem)
    throw ApiError.unauthorized('E-mail/CPF ou senha inválidos', 'CREDENCIAIS_INVALIDAS')
  }

  if (usuario.bloqueadoAte && usuario.bloqueadoAte > agora) {
    const minutos = Math.ceil((usuario.bloqueadoAte.getTime() - agora.getTime()) / 60_000)
    await registrarTentativa(dados.identificador, usuario.id, usuario.tenantId, false, 'CONTA_BLOQUEADA', origem)
    throw ApiError.forbidden(
      `Conta bloqueada por excesso de tentativas. Tente novamente em ${minutos} minuto(s)`,
      'CONTA_BLOQUEADA',
    )
  }

  if (!usuario.ativo || usuario.deletedAt) {
    await registrarTentativa(dados.identificador, usuario.id, usuario.tenantId, false, 'USUARIO_INATIVO', origem)
    throw ApiError.forbidden('Usuário inativo. Procure o administrador da sua empresa', 'USUARIO_INATIVO')
  }

  const senhaConfere = await bcrypt.compare(dados.senha, usuario.senhaHash)

  if (!senhaConfere) {
    await aplicarFalhaDeLogin(usuario.id, usuario.falhasLogin, config)
    await registrarTentativa(dados.identificador, usuario.id, usuario.tenantId, false, 'SENHA_INVALIDA', origem)
    throw ApiError.unauthorized('E-mail/CPF ou senha inválidos', 'CREDENCIAIS_INVALIDAS')
  }

  const acesso = assinarAccessToken({
    userId: usuario.id,
    tenantId: usuario.tenantId,
    role: usuario.role,
  })
  const refresh = gerarRefreshToken()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: usuario.id },
      data: { falhasLogin: 0, bloqueadoAte: null, ultimoLoginEm: agora },
    }),
    prisma.refreshToken.create({
      data: {
        tenantId: usuario.tenantId,
        userId: usuario.id,
        tokenHash: refresh.hash,
        expiresAt: refresh.expiraEm,
        ip: origem.ip,
        userAgent: origem.userAgent,
      },
    }),
  ])

  await registrarTentativa(dados.identificador, usuario.id, usuario.tenantId, true, null, origem)
  await registrarAuditoria({
    tenantId: usuario.tenantId,
    userId: usuario.id,
    acao: 'LOGIN',
    entidade: 'User',
    entidadeId: usuario.id,
    ip: origem.ip,
    userAgent: origem.userAgent,
  })

  return {
    accessToken: acesso.token,
    refreshToken: refresh.token,
    expiresIn: Math.floor((acesso.expiraEm.getTime() - Date.now()) / 1000),
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      tenantId: usuario.tenantId,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
    },
  }
}

/**
 * Renova o par de tokens com rotação: o refresh usado é revogado na hora e um
 * novo é emitido. Se um refresh antigo reaparecer depois, é sinal de token
 * roubado, e ele já não vale mais nada.
 */
export async function renovar(refreshToken: string, origem: Origem): Promise<ResultadoLogin> {
  const registro = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashDeToken(refreshToken) },
    include: {
      user: {
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          tenantId: true,
          ativo: true,
          deletedAt: true,
          precisaTrocarSenha: true,
        },
      },
    },
  })

  if (!registro || registro.revokedAt || registro.expiresAt <= new Date()) {
    throw ApiError.unauthorized('Sessão expirada. Faça login novamente', 'REFRESH_INVALIDO')
  }

  const usuario = registro.user

  if (!usuario.ativo || usuario.deletedAt) {
    throw ApiError.forbidden('Usuário inativo', 'USUARIO_INATIVO')
  }

  const acesso = assinarAccessToken({
    userId: usuario.id,
    tenantId: usuario.tenantId,
    role: usuario.role,
  })
  const novoRefresh = gerarRefreshToken()

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        tenantId: usuario.tenantId,
        userId: usuario.id,
        tokenHash: novoRefresh.hash,
        expiresAt: novoRefresh.expiraEm,
        ip: origem.ip,
        userAgent: origem.userAgent,
      },
    }),
  ])

  return {
    accessToken: acesso.token,
    refreshToken: novoRefresh.token,
    expiresIn: Math.floor((acesso.expiraEm.getTime() - Date.now()) / 1000),
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      tenantId: usuario.tenantId,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
    },
  }
}

/**
 * Logout de verdade: o `jti` do access token vai para `revoked_tokens` e o
 * refresh apresentado é revogado. O middleware de autenticação consulta essa
 * lista, então o token para de valer no mesmo instante, e não só quando expirar.
 */
export async function logout(
  dados: { userId: string; tenantId: string | null; jti: string; refreshToken?: string },
  origem: Origem,
): Promise<void> {
  const expiraEm = new Date(Date.now() + parseDuracaoParaMs(normalizarDuracao(env.JWT_EXPIRES_IN)))

  await prisma.revokedToken.upsert({
    where: { jti: dados.jti },
    create: {
      jti: dados.jti,
      userId: dados.userId,
      tenantId: dados.tenantId,
      expiresAt: expiraEm,
      motivo: 'LOGOUT',
    },
    update: {},
  })

  if (dados.refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashDeToken(dados.refreshToken), userId: dados.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  await registrarAuditoria({
    tenantId: dados.tenantId,
    userId: dados.userId,
    acao: 'LOGOUT',
    entidade: 'User',
    entidadeId: dados.userId,
    ip: origem.ip,
    userAgent: origem.userAgent,
  })
}

/**
 * Solicita recuperação de senha.
 *
 * Responde igual existindo ou não a conta. Se respondesse diferente, a rota
 * viraria um verificador de quem é cliente da plataforma.
 */
export async function solicitarRecuperacao(email: string, origem: Origem): Promise<void> {
  const usuario = await prisma.user.findUnique({
    where: { email },
    select: { id: true, tenantId: true, ativo: true, deletedAt: true },
  })

  if (!usuario || !usuario.ativo || usuario.deletedAt) {
    return
  }

  const token = crypto.randomBytes(32).toString('base64url')

  await prisma.passwordResetToken.create({
    data: {
      tenantId: usuario.tenantId,
      userId: usuario.id,
      tokenHash: hashDeToken(token),
      // O Plano Mestre define 1 hora de validade para o link.
      expiresAt: new Date(Date.now() + 3_600_000),
      ip: origem.ip,
    },
  })

  // TODO(notificacoes): trocar por envio real quando o módulo de e-mail entrar.
  if (env.NODE_ENV !== 'production') {
    logger.info({ link: `${env.APP_URL}/redefinir-senha?token=${token}` }, 'Link de recuperação gerado')
  }

  await registrarAuditoria({
    tenantId: usuario.tenantId,
    userId: usuario.id,
    acao: 'SOLICITAR_RECUPERACAO_SENHA',
    entidade: 'User',
    entidadeId: usuario.id,
    ip: origem.ip,
    userAgent: origem.userAgent,
  })
}

export async function redefinirSenha(
  dados: { token: string; novaSenha: string },
  origem: Origem,
): Promise<void> {
  const config = await obterConfiguracao()
  validarForcaDaSenha(dados.novaSenha, config)

  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashDeToken(dados.token) },
    select: { id: true, userId: true, tenantId: true, expiresAt: true, usedAt: true },
  })

  if (!registro || registro.usedAt || registro.expiresAt <= new Date()) {
    throw ApiError.badRequest('Link de recuperação inválido ou expirado', 'TOKEN_RECUPERACAO_INVALIDO')
  }

  const senhaHash = await bcrypt.hash(dados.novaSenha, SALT_ROUNDS)
  const agora = new Date()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: {
        senhaHash,
        senhaAlteradaEm: agora,
        precisaTrocarSenha: false,
        falhasLogin: 0,
        bloqueadoAte: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { usedAt: agora },
    }),
    // Derruba as sessões abertas: os access tokens caem por `senhaAlteradaEm`,
    // os refresh tokens são revogados aqui.
    prisma.refreshToken.updateMany({
      where: { userId: registro.userId, revokedAt: null },
      data: { revokedAt: agora },
    }),
  ])

  await registrarAuditoria({
    tenantId: registro.tenantId,
    userId: registro.userId,
    acao: 'REDEFINIR_SENHA',
    entidade: 'User',
    entidadeId: registro.userId,
    ip: origem.ip,
    userAgent: origem.userAgent,
  })
}

export async function trocarSenha(
  dados: { userId: string; tenantId: string | null; senhaAtual: string; novaSenha: string },
  origem: Origem,
): Promise<void> {
  const config = await obterConfiguracao()
  validarForcaDaSenha(dados.novaSenha, config)

  const usuario = await prisma.user.findUnique({
    where: { id: dados.userId },
    select: { id: true, senhaHash: true },
  })

  if (!usuario) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  const confere = await bcrypt.compare(dados.senhaAtual, usuario.senhaHash)
  if (!confere) {
    throw ApiError.badRequest('Senha atual incorreta', 'SENHA_ATUAL_INVALIDA')
  }

  const novoHash = await bcrypt.hash(dados.novaSenha, SALT_ROUNDS)
  const agora = new Date()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: dados.userId },
      data: { senhaHash: novoHash, senhaAlteradaEm: agora, precisaTrocarSenha: false },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: dados.userId, revokedAt: null },
      data: { revokedAt: agora },
    }),
  ])

  await registrarAuditoria({
    tenantId: dados.tenantId,
    userId: dados.userId,
    acao: 'TROCAR_SENHA',
    entidade: 'User',
    entidadeId: dados.userId,
    ip: origem.ip,
    userAgent: origem.userAgent,
  })
}

// ---------------------------------------------------------------------------
// auxiliares
// ---------------------------------------------------------------------------

/** Aceita e-mail ou CPF. CPF é comparado só pelos dígitos, sem ponto e traço. */
async function buscarPorIdentificador(identificador: string) {
  const email = identificador.toLowerCase()
  const digitos = identificador.replace(/\D/g, '')

  return prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(digitos.length === 11 ? [{ cpf: digitos }] : [])],
    },
    select: {
      id: true,
      nome: true,
      email: true,
      senhaHash: true,
      role: true,
      tenantId: true,
      ativo: true,
      deletedAt: true,
      falhasLogin: true,
      bloqueadoAte: true,
      precisaTrocarSenha: true,
    },
  })
}

async function aplicarFalhaDeLogin(
  userId: string,
  falhasAtuais: number,
  config: ConfiguracaoSistema,
): Promise<void> {
  const falhas = falhasAtuais + 1

  if (falhas >= config.maxTentativasLogin) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        falhasLogin: 0,
        bloqueadoAte: new Date(Date.now() + config.bloqueioMinutos * 60_000),
      },
    })
    return
  }

  await prisma.user.update({ where: { id: userId }, data: { falhasLogin: falhas } })
}

async function registrarTentativa(
  identificador: string,
  userId: string | null,
  tenantId: string | null,
  sucesso: boolean,
  motivo: string | null,
  origem: Origem,
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { identificador, userId, tenantId, sucesso, motivo, ip: origem.ip, userAgent: origem.userAgent },
    })
  } catch (erro) {
    logger.error({ err: erro }, 'Falha ao registrar tentativa de login')
  }
}

export function validarForcaDaSenha(senha: string, config: ConfiguracaoSistema): void {
  const faltando: string[] = []

  if (senha.length < config.senhaMinCaracteres) {
    faltando.push(`no mínimo ${config.senhaMinCaracteres} caracteres`)
  }
  if (config.senhaExigeMaiuscula && !/[A-Z]/.test(senha)) {
    faltando.push('uma letra maiúscula')
  }
  if (config.senhaExigeNumero && !/\d/.test(senha)) {
    faltando.push('um número')
  }
  if (config.senhaExigeSimbolo && !/[^A-Za-z0-9]/.test(senha)) {
    faltando.push('um símbolo')
  }

  if (faltando.length > 0) {
    throw ApiError.badRequest(`A senha precisa ter ${faltando.join(', ')}`, 'SENHA_FRACA')
  }
}

/** jsonwebtoken aceita "8h"; o parser de duração local usa o mesmo formato. */
function normalizarDuracao(valor: string): string {
  return /^\d+$/.test(valor) ? `${valor}s` : valor
}

/** Dados do usuário logado, usados pela rota GET /auth/me. */
export async function obterPerfil(userId: string) {
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      telefone: true,
      cargo: true,
      role: true,
      tenantId: true,
      precisaTrocarSenha: true,
      ultimoLoginEm: true,
      tenant: {
        select: { id: true, nome: true, slug: true, plano: true, status: true, logoUrl: true },
      },
      team: { select: { id: true, nome: true } },
    },
  })

  if (!usuario) {
    throw ApiError.notFound('Usuário não encontrado')
  }

  return usuario
}
