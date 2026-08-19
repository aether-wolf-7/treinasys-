# Deploy do TreinaSys

Guia completo para colocar o sistema no ar num servidor novo. Foi escrito para
ser seguido por qualquer desenvolvedor, do zero, sem conhecer o projeto.

Ao final você terá: aplicação rodando com HTTPS, banco PostgreSQL, reinício
automático em caso de queda e backup diário criptografado.

---

## 1. O que você precisa antes de começar

| Item | Observação |
|---|---|
| Um servidor (VPS) | Ubuntu 22.04 ou 24.04, mínimo 2 GB de RAM |
| Acesso SSH como root | Fornecido pelo provedor ao criar o servidor |
| Um domínio | Apontado para o IP do servidor (registro tipo A) |
| Acesso ao repositório | Chave SSH ou token de leitura |

**Sobre o tamanho do servidor.** Para até algumas centenas de motoristas, 2 GB de
RAM com 1 ou 2 núcleos dá conta com folga. O gargalo desse sistema é banco e
geração de PDF, não CPU.

---

## 2. Preparar o servidor

Conecte como root e rode o script de preparação **uma única vez**:

```bash
ssh root@SEU_IP
git clone https://github.com/aether-wolf-7/treinasys.git /var/www/treinasys
cd /var/www/treinasys
bash deploy/setup-servidor.sh
```

O script instala Node.js 20, PostgreSQL, Nginx, PM2, firewall e fail2ban, cria o
usuário `treinasys` (sem poderes de root) e cria o banco de dados.

> **Ao terminar, ele mostra a senha do banco uma única vez.** Copie antes de
> fechar o terminal. Se perder, dá para gerar outra, mas é trabalho à toa.

---

## 3. Configurar as variáveis de ambiente

```bash
cd /var/www/treinasys/backend
cp .env.production.example .env
nano .env
```

Preencha:

- `DATABASE_URL` — use a senha que o script mostrou
- `JWT_SECRET` — gere com `openssl rand -base64 48`
- `APP_URL` e `API_URL` — seu domínio, com `https://`

Depois proteja o arquivo:

```bash
chmod 600 .env
chown treinasys:treinasys .env
```

O `.env` **nunca** entra no repositório. Ele existe só no servidor.

---

## 4. Primeiro deploy

```bash
chown -R treinasys:treinasys /var/www/treinasys
su - treinasys
cd /var/www/treinasys
bash deploy/deploy.sh
```

O script instala dependências, aplica as migrations, compila o backend e o
frontend, sobe a API no PM2 e confere se ela respondeu. Se o `/health` não
responder, ele falha em vez de dizer que deu certo.

### Criar o primeiro usuário Master

```bash
cd /var/www/treinasys/backend
npx tsx prisma/seed.ts
```

> O seed cria usuários de demonstração com senha conhecida. **Em produção, troque
> a senha do Master no primeiro acesso e remova os usuários de teste.**

---

## 5. Nginx e HTTPS

```bash
exit   # voltar para root
cp /var/www/treinasys/deploy/nginx-treinasys.conf /etc/nginx/sites-available/treinasys
sed -i 's/SEU_DOMINIO/app.seudominio.com.br/' /etc/nginx/sites-available/treinasys
ln -s /etc/nginx/sites-available/treinasys /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Com o domínio já apontando para o IP, emita o certificado:

```bash
certbot --nginx -d app.seudominio.com.br
```

O certbot edita o Nginx sozinho, ativa o HTTPS e renova o certificado
automaticamente. Confira a renovação com `certbot renew --dry-run`.

---

## 6. Backup diário

O backup é criptografado. Primeiro crie a chave:

```bash
mkdir -p /etc/treinasys
openssl rand -base64 48 > /etc/treinasys/backup.chave
chmod 600 /etc/treinasys/backup.chave
```

> **Guarde uma cópia dessa chave fora do servidor.** Backup criptografado com a
> chave perdida junto não serve para nada.

Agende para as 3h da manhã:

```bash
su - treinasys
crontab -e
```

Acrescente:

```
0 3 * * * /var/www/treinasys/deploy/backup.sh >> /var/log/treinasys/backup.log 2>&1
```

O script gera o dump, criptografa, **testa se o arquivo abre** e apaga os
anteriores a 30 dias.

### Restaurar

```bash
gpg --decrypt --passphrase-file /etc/treinasys/backup.chave \
  /var/backups/treinasys/treinasys_AAAA-MM-DD_HHMM.sql.gz.gpg \
  | gunzip | psql treinasys
```

---

## 7. Dia a dia

| Preciso | Comando |
|---|---|
| Publicar uma atualização | `su - treinasys && cd /var/www/treinasys && bash deploy/deploy.sh` |
| Ver os logs ao vivo | `pm2 logs treinasys-api` |
| Ver o estado do processo | `pm2 status` |
| Reiniciar a API | `pm2 reload treinasys-api` |
| Ver os logs do Nginx | `tail -f /var/log/nginx/error.log` |
| Testar se está no ar | `curl https://SEU_DOMINIO/health` |

---

## 8. Quando algo dá errado

**A página abre mas a API dá erro**
`pm2 status` e `pm2 logs treinasys-api`. Quase sempre é `.env` incompleto: a
aplicação valida as variáveis no boot e diz exatamente qual está faltando.

**Erro 502 no navegador**
O Nginx está no ar mas a API não. Rode `pm2 status`; se estiver parada,
`pm2 logs treinasys-api` mostra o motivo.

**Erro de conexão com o banco**
Confira o `DATABASE_URL` e se o serviço está de pé: `systemctl status postgresql`.

**O certificado não renovou**
`certbot renew --dry-run`. O motivo mais comum é a porta 80 fechada no firewall.

**Depois de restaurar um backup, ninguém consegue entrar**
Esperado se o `JWT_SECRET` mudou. Todos precisam fazer login de novo.

---

## 9. O que fica em cada lugar

```
/var/www/treinasys/           código
  backend/.env                segredos (600, fora do git)
  backend/dist/               backend compilado
  frontend/dist/              frontend compilado, servido pelo Nginx
/var/log/treinasys/           logs da aplicação
/var/backups/treinasys/       backups criptografados
/etc/treinasys/backup.chave   chave do backup (600)
/etc/nginx/sites-available/treinasys
```

---

## 10. Checklist de segurança

- [ ] `.env` com permissão 600 e fora do repositório
- [ ] `JWT_SECRET` gerado aleatoriamente, diferente do de desenvolvimento
- [ ] Firewall ativo, só 22, 80 e 443 (`ufw status`)
- [ ] PostgreSQL escutando apenas em localhost
- [ ] HTTPS ativo e renovando (`certbot renew --dry-run`)
- [ ] Backup rodando e **restauração testada pelo menos uma vez**
- [ ] Chave do backup guardada fora do servidor
- [ ] Senhas dos usuários de demonstração trocadas ou usuários removidos
- [ ] Aplicação rodando como `treinasys`, nunca como root
