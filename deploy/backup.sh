#!/usr/bin/env bash
#
# TreinaSys - backup diario do banco, criptografado.
#
# Cumpre o que foi combinado em contrato: copia diaria, criptografada, com 30
# dias de retencao.
#
# Instalar no cron do usuario treinasys, 3h da manha:
#   0 3 * * * /var/www/treinasys/deploy/backup.sh >> /var/log/treinasys/backup.log 2>&1
#
# A senha de criptografia fica em /etc/treinasys/backup.chave (permissao 600).
# Sem esse arquivo NAO DA para restaurar. Guarde uma copia fora do servidor:
# backup criptografado com a chave perdida junto e o mesmo que nao ter backup.
#
set -euo pipefail

DIR_BACKUP="/var/backups/treinasys"
ARQ_CHAVE="/etc/treinasys/backup.chave"
DIAS_RETENCAO=30
BANCO="treinasys"

carimbo="$(date +%Y-%m-%d_%H%M)"
destino="${DIR_BACKUP}/treinasys_${carimbo}.sql.gz.gpg"

mkdir -p "$DIR_BACKUP"

if [[ ! -f "$ARQ_CHAVE" ]]; then
  echo "ERRO: chave de criptografia nao encontrada em ${ARQ_CHAVE}"
  echo "Crie com:  openssl rand -base64 48 | sudo tee ${ARQ_CHAVE} && sudo chmod 600 ${ARQ_CHAVE}"
  exit 1
fi

echo "[$(date -Iseconds)] iniciando backup de ${BANCO}"

# pg_dump -> gzip -> gpg, tudo em fluxo. O dump em texto puro nunca toca o disco.
pg_dump --no-owner --no-privileges "$BANCO" \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase-file "$ARQ_CHAVE" \
        --output "$destino"

chmod 600 "$destino"
tamanho="$(du -h "$destino" | cut -f1)"
echo "[$(date -Iseconds)] backup gerado: ${destino} (${tamanho})"

# Verifica que o arquivo abre. Backup que nunca foi testado nao e backup.
if ! gpg --batch --quiet --decrypt --passphrase-file "$ARQ_CHAVE" "$destino" 2>/dev/null \
     | gzip -t; then
  echo "[$(date -Iseconds)] ERRO: o backup gerado nao passou na verificacao"
  exit 1
fi
echo "[$(date -Iseconds)] verificacao ok"

apagados="$(find "$DIR_BACKUP" -name 'treinasys_*.sql.gz.gpg' -mtime +${DIAS_RETENCAO} -print -delete | wc -l)"
echo "[$(date -Iseconds)] backups antigos removidos: ${apagados}"
echo "[$(date -Iseconds)] concluido"

# Para restaurar:
#   gpg --decrypt --passphrase-file /etc/treinasys/backup.chave ARQUIVO.gpg \
#     | gunzip | psql treinasys
