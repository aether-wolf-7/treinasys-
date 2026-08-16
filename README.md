# TreinaSys

Plataforma SaaS multiempresa para gestão de treinamentos de motoristas, voltada ao setor de transporte e logística.

O sistema permite que cada empresa aplique treinamentos obrigatórios e reciclagens à sua frota, tanto em formato EAD quanto presencial, com avaliações, certificados verificáveis por QR code e controle automático de validade.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 LTS + Express 5 + TypeScript |
| Banco de dados | PostgreSQL 16 + Prisma |
| Frontend | React 18 + Vite + Tailwind CSS |
| Autenticação | JWT + bcrypt (salt 12) |
| PDFs | pdf-lib + Puppeteer |
| Arquivos | Object storage compatível com S3 |
| Servidor | Nginx + PM2 |

## Estrutura

```
treinasys/
├── backend/     API REST, regras de negócio e banco
├── frontend/    Interface web (React)
└── docs/        Instalação, deploy e decisões de arquitetura
```

## Decisões de arquitetura

**Multitenancy por `tenant_id`.** Banco e schema compartilhados, com a coluna `tenant_id` em toda tabela de negócio e filtro obrigatório em toda query. É a abordagem de melhor custo-benefício para esta fase e a única que é praticamente impossível de corrigir depois que a base cresce, por isso foi definida antes de qualquer outra coisa.

**Anti-skip validado no servidor.** O tempo mínimo de cada slide é conferido comparando timestamps gerados pelo próprio servidor, nunca o que o navegador informa. Cada marco fica registrado em `progress_events`. Sem isso o certificado não resiste a contestação, o que num setor fiscalizado inviabiliza o produto.

**Invalidação de token via banco.** O logout grava o `jti` do token em `revoked_tokens` e o middleware consulta essa lista. Redis só entra numa fase posterior, então a revogação precisa de um lugar durável agora.

**Conteúdo carregado dinamicamente pela API.** Nada de treinamento hardcoded em arquivo JS. Aulas, slides e questões vêm do banco, o que permite o construtor de conteúdo e o versionamento.

**SPA estática servida pelo Nginx.** O frontend compila para arquivos estáticos, sem um segundo processo Node em produção. Menos memória no servidor e menos coisa para manter no ar.

## Rodando localmente

Pré-requisitos: Node.js 20+, PostgreSQL 16+ (14+ funciona em desenvolvimento).

```bash
# backend
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL e JWT_SECRET
npx prisma migrate dev
npm run dev
```

As variáveis de ambiente estão documentadas em `backend/.env.example`. O arquivo `.env` nunca vai para o repositório.

## Documentação da API

A API segue o padrão REST com versionamento em `/api/v1` e respostas no formato `{ success, data, error, meta }`. A documentação Swagger fica disponível em `/api/docs` com a aplicação rodando.

## Status

Em desenvolvimento.
