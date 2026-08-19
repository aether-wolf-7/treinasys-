#!/usr/bin/env bash
#
# TreinaSys - deploy.
#
# Roda como usuario "treinasys", dentro de /var/www/treinasys:
#   bash deploy/deploy.sh
#
set -euo pipefail

DIR_APP="/var/www/treinasys"
cd "$DIR_APP"

echo "==> Buscando a versao mais recente"
git pull --ff-only origin main

echo "==> Backend: dependencias, migrations e build"
cd "$DIR_APP/backend"
npm ci --omit=dev --no-audit --no-fund
npx prisma generate
# `migrate deploy` so aplica migrations ja versionadas. Nunca altera o schema
# sozinho nem pede confirmacao, que e o comportamento certo em producao.
npx prisma migrate deploy
npm install --no-save typescript @types/node
npx tsc
npm prune --omit=dev

echo "==> Frontend: dependencias e build"
cd "$DIR_APP/frontend"
npm ci --no-audit --no-fund
npm run build

echo "==> Subindo a API"
cd "$DIR_APP"
sudo mkdir -p /var/log/treinasys
sudo chown treinasys:treinasys /var/log/treinasys
pm2 reload deploy/ecosystem.config.cjs --update-env || pm2 start deploy/ecosystem.config.cjs
pm2 save

echo "==> Conferindo se a aplicacao respondeu"
sleep 3
if curl -fsS http://127.0.0.1:3333/health >/dev/null; then
  echo "Deploy concluido. Aplicacao no ar."
else
  echo "ATENCAO: a aplicacao nao respondeu no /health. Veja: pm2 logs treinasys-api"
  exit 1
fi
