#!/usr/bin/env bash
#
# TreinaSys - preparacao de um servidor novo (Ubuntu 22.04 ou 24.04).
#
# Roda UMA vez, como root, num servidor recem criado. Depois disso o deploy do
# dia a dia e feito pelo deploy.sh, como usuario "treinasys".
#
#   bash setup-servidor.sh
#
set -euo pipefail

USUARIO="treinasys"
DIR_APP="/var/www/treinasys"
VERSAO_NODE="20"

echo "==> Atualizando o sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Instalando pacotes base"
apt-get install -y -qq curl git ufw fail2ban nginx postgresql postgresql-contrib \
  certbot python3-certbot-nginx unattended-upgrades gnupg ca-certificates

echo "==> Instalando Node.js ${VERSAO_NODE}"
curl -fsSL "https://deb.nodesource.com/setup_${VERSAO_NODE}.x" | bash -
apt-get install -y -qq nodejs
npm install -g pm2

echo "==> Criando usuario de aplicacao (sem root, sem senha)"
if ! id "$USUARIO" &>/dev/null; then
  adduser --disabled-password --gecos "" "$USUARIO"
fi
mkdir -p "$DIR_APP"
chown -R "$USUARIO:$USUARIO" "$DIR_APP"

echo "==> Firewall: so SSH, HTTP e HTTPS"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> fail2ban protegendo o SSH"
systemctl enable --now fail2ban

echo "==> Atualizacoes de seguranca automaticas"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> PostgreSQL: banco e usuario da aplicacao"
SENHA_BANCO="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'treinasys') THEN
    CREATE ROLE treinasys LOGIN PASSWORD '${SENHA_BANCO}';
  END IF;
END
\$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='treinasys'" \
  | grep -q 1 || sudo -u postgres createdb -O treinasys treinasys

# O Postgres so escuta em localhost. Ninguem alcanca o banco pela internet.
echo "==> PostgreSQL restrito a localhost"
systemctl enable --now postgresql

echo "==> PM2 subindo junto com o servidor"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USUARIO" --hp "/home/$USUARIO" >/dev/null

cat <<FIM

============================================================
  Servidor preparado.

  GUARDE A SENHA DO BANCO. Ela aparece uma unica vez:

    ${SENHA_BANCO}

  Coloque no .env da aplicacao como:
    DATABASE_URL="postgresql://treinasys:${SENHA_BANCO}@localhost:5432/treinasys?schema=public"

  Proximos passos:
    1. copiar o codigo para ${DIR_APP}
    2. criar ${DIR_APP}/backend/.env
    3. rodar deploy/deploy.sh
    4. apontar o dominio e rodar: certbot --nginx -d SEU.DOMINIO
============================================================

FIM
