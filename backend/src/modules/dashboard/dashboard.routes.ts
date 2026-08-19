import { Router } from 'express'
import { Role } from '@prisma/client'
import { authenticate } from '../../middlewares/authenticate'
import { autorizar } from '../../middlewares/authorize'
import { exigirTenant, resolverTenant, tenantDaRequisicao } from '../../middlewares/tenant'
import { sendOk } from '../../utils/response'
import { obterResumo } from './dashboard.service'

export const dashboardRoutes = Router()

dashboardRoutes.get(
  '/resumo',
  authenticate,
  resolverTenant,
  exigirTenant,
  autorizar(Role.GESTOR),
  async (req, res) => {
    const resumo = await obterResumo(tenantDaRequisicao(req))
    return sendOk(res, resumo)
  },
)
