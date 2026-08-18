import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../../middlewares/authenticate'
import { validar } from '../../middlewares/validate'
import * as controller from './auth.controller'
import {
  esqueciSenhaSchema,
  loginSchema,
  logoutSchema,
  redefinirSenhaSchema,
  renovarSchema,
  trocarSenhaSchema,
} from './auth.schemas'

/**
 * Limite específico para as rotas que aceitam credencial.
 *
 * O bloqueio de conta protege um usuário; este limite protege a plataforma de
 * quem varre muitos usuários a partir do mesmo IP, que o bloqueio por conta
 * sozinho não pega.
 */
const limiteCredenciais = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente',
    },
  },
})

export const authRoutes = Router()

authRoutes.post('/login', limiteCredenciais, validar({ body: loginSchema }), controller.login)
authRoutes.post('/refresh', limiteCredenciais, validar({ body: renovarSchema }), controller.renovar)
authRoutes.post('/logout', authenticate, validar({ body: logoutSchema }), controller.logout)
authRoutes.get('/me', authenticate, controller.me)

authRoutes.post(
  '/forgot-password',
  limiteCredenciais,
  validar({ body: esqueciSenhaSchema }),
  controller.esqueciSenha,
)
authRoutes.post(
  '/reset-password',
  limiteCredenciais,
  validar({ body: redefinirSenhaSchema }),
  controller.redefinirSenha,
)
authRoutes.post(
  '/change-password',
  authenticate,
  validar({ body: trocarSenhaSchema }),
  controller.trocarSenha,
)
