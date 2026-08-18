import { criarApp } from './app'
import { env } from './config/env'
import { logger } from './lib/logger'
import { disconnectPrisma, prisma } from './lib/prisma'

async function iniciar(): Promise<void> {
  // Falha cedo e com mensagem clara se o banco não estiver acessível, em vez de
  // subir "com sucesso" e quebrar na primeira requisição.
  try {
    await prisma.$connect()
    logger.info('Conexão com o banco estabelecida')
  } catch (erro) {
    logger.fatal({ err: erro }, 'Não foi possível conectar ao banco de dados')
    process.exit(1)
  }

  const app = criarApp()

  const servidor = app.listen(env.PORT, () => {
    logger.info(`TreinaSys API rodando em ${env.API_URL} (${env.NODE_ENV})`)
  })

  const encerrar = (sinal: string) => {
    return async () => {
      logger.info(`${sinal} recebido, encerrando`)

      servidor.close(async () => {
        await disconnectPrisma()
        logger.info('Encerrado')
        process.exit(0)
      })

      // Se as conexões abertas não fecharem em 10s, encerra de qualquer forma.
      setTimeout(() => {
        logger.warn('Encerramento forçado por timeout')
        process.exit(1)
      }, 10_000).unref()
    }
  }

  process.on('SIGTERM', encerrar('SIGTERM'))
  process.on('SIGINT', encerrar('SIGINT'))
}

void iniciar()
