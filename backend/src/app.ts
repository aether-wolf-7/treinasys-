import compression from 'compression'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { env } from './config/env'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'
import { errorHandler, notFoundHandler } from './middlewares/error-handler'
import { limiteGlobal } from './middlewares/rate-limit'
import { authRoutes } from './modules/auth/auth.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { sendError, sendOk } from './utils/response'

export function criarApp(): Express {
  const app = express()

  // Em produção a aplicação roda atrás do Nginx. Sem isto, `req.ip` seria o IP
  // do proxy, e o rate limiting e a auditoria registrariam sempre o mesmo valor.
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? [env.APP_URL] : true,
      credentials: true,
    }),
  )
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  app.use(
    pinoHttp({
      logger,
      // Ruído a menos: health check de monitoramento bate de minuto em minuto.
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  )

  app.use(limiteGlobal)

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return sendOk(res, { status: 'ok', banco: 'ok', ambiente: env.NODE_ENV })
    } catch {
      return sendError(res, 503, 'BANCO_INDISPONIVEL', 'Banco de dados indisponível')
    }
  })

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/dashboard', dashboardRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
