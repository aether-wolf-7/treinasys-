import type { Request, Response } from 'express'
import { origemDaRequisicao } from '../../lib/audit'
import { ApiError } from '../../utils/api-error'
import { sendNoContent, sendOk } from '../../utils/response'
import * as authService from './auth.service'
import type {
  EsqueciSenhaInput,
  LoginInput,
  RedefinirSenhaInput,
  RenovarInput,
  TrocarSenhaInput,
} from './auth.schemas'

export async function login(req: Request, res: Response): Promise<Response> {
  const dados = req.body as LoginInput
  const resultado = await authService.login(dados, origemDaRequisicao(req))
  return sendOk(res, resultado)
}

export async function renovar(req: Request, res: Response): Promise<Response> {
  const { refreshToken } = req.body as RenovarInput
  const resultado = await authService.renovar(refreshToken, origemDaRequisicao(req))
  return sendOk(res, resultado)
}

export async function logout(req: Request, res: Response): Promise<Response> {
  const auth = req.auth
  if (!auth) throw ApiError.unauthorized()

  const { refreshToken } = req.body as { refreshToken?: string }

  await authService.logout(
    { userId: auth.userId, tenantId: auth.tenantId, jti: auth.jti, refreshToken },
    origemDaRequisicao(req),
  )

  return sendNoContent(res)
}

export async function me(req: Request, res: Response): Promise<Response> {
  const auth = req.auth
  if (!auth) throw ApiError.unauthorized()

  const perfil = await authService.obterPerfil(auth.userId)
  return sendOk(res, perfil)
}

/**
 * Responde 204 sempre, exista ou não a conta. É proposital: uma resposta
 * diferente para e-mail inexistente transformaria a rota num verificador de
 * quem tem cadastro na plataforma.
 */
export async function esqueciSenha(req: Request, res: Response): Promise<Response> {
  const { email } = req.body as EsqueciSenhaInput
  await authService.solicitarRecuperacao(email, origemDaRequisicao(req))
  return sendNoContent(res)
}

export async function redefinirSenha(req: Request, res: Response): Promise<Response> {
  const dados = req.body as RedefinirSenhaInput
  await authService.redefinirSenha(dados, origemDaRequisicao(req))
  return sendNoContent(res)
}

export async function trocarSenha(req: Request, res: Response): Promise<Response> {
  const auth = req.auth
  if (!auth) throw ApiError.unauthorized()

  const dados = req.body as TrocarSenhaInput

  await authService.trocarSenha(
    {
      userId: auth.userId,
      tenantId: auth.tenantId,
      senhaAtual: dados.senhaAtual,
      novaSenha: dados.novaSenha,
    },
    origemDaRequisicao(req),
  )

  return sendNoContent(res)
}
