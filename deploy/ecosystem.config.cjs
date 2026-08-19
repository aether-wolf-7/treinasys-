/**
 * PM2 - processo da API em producao.
 *
 * Modo cluster com uma instancia por nucleo. Se o processo cair, o PM2 sobe de
 * novo; se o servidor reiniciar, o systemd sobe o PM2 (configurado no setup).
 */
module.exports = {
  apps: [
    {
      name: 'treinasys-api',
      cwd: '/var/www/treinasys/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      // Se ficar reiniciando em loop, para e deixa o erro visivel no log em vez
      // de mascarar o problema reiniciando para sempre.
      max_restarts: 10,
      min_uptime: '20s',
      error_file: '/var/log/treinasys/api-erro.log',
      out_file: '/var/log/treinasys/api-saida.log',
      merge_logs: true,
      time: true,
    },
  ],
}
