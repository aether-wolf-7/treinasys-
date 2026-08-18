import pino from 'pino'
import { env } from '../config/env'

/**
 * Logger da aplicação.
 *
 * O bloco `redact` não é enfeite: é o compromisso de LGPD assumido em contrato.
 * Senha, token e CPF nunca podem aparecer em log, nem em desenvolvimento, porque
 * log de desenvolvimento vira print em grupo de WhatsApp com muita facilidade.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.senha',
      'req.body.senhaAtual',
      'req.body.novaSenha',
      'req.body.confirmacaoSenha',
      'req.body.cpf',
      'req.body.token',
      'res.headers["set-cookie"]',
      'senhaHash',
      '*.senhaHash',
    ],
    remove: true,
  },
})
