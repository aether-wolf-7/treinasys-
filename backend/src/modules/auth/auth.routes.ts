import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { limitePorConta, limitePorIpNasCredenciais } from '../../middlewares/rate-limit'
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

export const authRoutes = Router()

authRoutes.post(
  '/login',
  limitePorIpNasCredenciais,
  limitePorConta,
  validar({ body: loginSchema }),
  controller.login,
)
authRoutes.post(
  '/refresh',
  limitePorIpNasCredenciais,
  validar({ body: renovarSchema }),
  controller.renovar,
)
authRoutes.post('/logout', authenticate, validar({ body: logoutSchema }), controller.logout)
authRoutes.get('/me', authenticate, controller.me)

authRoutes.post(
  '/forgot-password',
  limitePorIpNasCredenciais,
  limitePorConta,
  validar({ body: esqueciSenhaSchema }),
  controller.esqueciSenha,
)
authRoutes.post(
  '/reset-password',
  limitePorIpNasCredenciais,
  limitePorConta,
  validar({ body: redefinirSenhaSchema }),
  controller.redefinirSenha,
)
authRoutes.post(
  '/change-password',
  authenticate,
  validar({ body: trocarSenhaSchema }),
  controller.trocarSenha,
)
