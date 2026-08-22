#!/usr/bin/env bash
#
# TreinaSys - endurecimento inicial de um servidor recem entregue.
#
# Roda UMA vez, como root, num servidor que acabou de ser recebido do cliente.
# Depois disso o acesso passa a ser exclusivamente por chave SSH.
#
#   bash hardening-inicial.sh "ssh-ed25519 AAAA... treinasys-deploy"
#
# O argumento e a CHAVE PUBLICA que vai ganhar acesso. A chave publica pode
# circular à vontade; quem abre a porta e a chave privada, que nunca sai da sua
# maquina.
#
# ORDEM IMPORTA. A chave e instalada e TESTADA antes de desligar a senha, e o
# SSH so e endurecido depois. Fazer ao contrario e o jeito classico de ficar
# trancado do lado de fora do proprio servidor.
#
set -euo pipefail

CHAVE_PUBLICA="${1:-}"

if [[ -z "$CHAVE_PUBLICA" ]]; then
  echo "ERRO: informe a chave publica como argumento."
  echo "Uso: bash hardening-inicial.sh \"ssh-ed25519 AAAA... comentario\""
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "ERRO: rode como root."
  exit 1
fi

echo "==> 1/5  Instalando a chave publica"
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
if ! grep -qF "$CHAVE_PUBLICA" /root/.ssh/authorized_keys; then
  echo "$CHAVE_PUBLICA" >> /root/.ssh/authorized_keys
fi
echo "    chaves autorizadas: $(wc -l < /root/.ssh/authorized_keys)"

echo "==> 2/5  Criando swap de 2 GB"
# Um servidor de 1 nucleo sem swap trava na hora de compilar o frontend, e
# quando trava leva junto o que mais estiver rodando na maquina.
if swapon --show | grep -q swapfile; then
  echo "    swap ja existia, mantido"
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    swap criado"
fi
sysctl -w vm.swappiness=10 >/dev/null
grep -q vm.swappiness /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "==> 3/5  Firewall"
# O SSH e liberado ANTES de habilitar o ufw. Invertendo isso, a sessao atual cai.
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ufw status | head -6 | sed 's/^/    /'

echo "==> 4/5  Atualizacoes de seguranca automaticas"
apt-get update -qq
apt-get install -y -qq unattended-upgrades >/dev/null
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true

echo "==> 5/5  SSH somente por chave"
cat > /etc/ssh/sshd_config.d/99-treinasys.conf <<'CONF'
PasswordAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
KbdInteractiveAuthentication no
CONF
sshd -t
systemctl reload ssh
echo "    sshd recarregado"

cat <<'FIM'

============================================================
  Servidor endurecido.

  ANTES DE FECHAR ESTE TERMINAL, abra outro terminal e teste:

    ssh -i ~/.ssh/treinasys_ed25519 root@IP_DO_SERVIDOR

  Se entrar, esta tudo certo. Se NAO entrar, use este terminal
  ainda aberto para desfazer:

    rm /etc/ssh/sshd_config.d/99-treinasys.conf && systemctl reload ssh

  Recuperacao de emergencia: o painel da Hostinger tem um console
  pelo navegador que funciona mesmo com o SSH bloqueado, e permite
  redefinir a senha de root a qualquer momento.

  Falta ainda trocar a senha de root, com:

    passwd root

============================================================

FIM
