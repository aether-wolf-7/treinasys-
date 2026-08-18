import { PrismaClient, PlanTier, ReactionScale, Role, TenantStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT_ROUNDS = 12

/** Senha dos usuários de desenvolvimento. Não existe em produção. */
const SENHA_DEV = 'Treinasys@2026'

/**
 * As 13 categorias de avaliação de reação estão listadas no Módulo 8.3 do Plano
 * Mestre. O Administrador de cada empresa liga e desliga as que quiser, então
 * este formulário nasce como o padrão da plataforma, com uma pergunta por
 * categoria para o cliente ter algo utilizável desde o primeiro dia.
 */
const CATEGORIAS_REACAO: Array<{ categoria: string; texto: string; escala: ReactionScale }> = [
  { categoria: 'Organização', texto: 'A organização do treinamento atendeu suas expectativas?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Conteúdo', texto: 'O conteúdo apresentado foi claro e objetivo?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Instrutor', texto: 'O instrutor demonstrou domínio do assunto?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Aplicabilidade', texto: 'O que você aprendeu se aplica ao seu dia a dia de trabalho?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Segurança', texto: 'O treinamento reforçou práticas seguras na sua operação?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Direção Defensiva', texto: 'O conteúdo contribuiu para sua direção defensiva?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Legislação', texto: 'As exigências legais abordadas ficaram claras?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Plataforma EAD', texto: 'A plataforma foi fácil de usar no seu celular?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Recursos Didáticos', texto: 'Os vídeos, imagens e textos ajudaram no entendimento?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Autoavaliação', texto: 'Como você avalia seu próprio empenho durante o treinamento?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'Satisfação Geral', texto: 'Qual sua satisfação geral com este treinamento?', escala: ReactionScale.LIKERT_5 },
  { categoria: 'NPS', texto: 'De 0 a 10, o quanto você recomendaria este treinamento a um colega?', escala: ReactionScale.NPS_0_10 },
  { categoria: 'Perguntas Abertas', texto: 'O que poderia melhorar neste treinamento?', escala: ReactionScale.TEXTO_LIVRE },
]

async function main(): Promise<void> {
  console.log('Semeando o banco...\n')

  // ── Configuração global (Módulo 14) ──────────────────────────────────────
  await prisma.systemConfig.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  })
  console.log('  configuração global')

  const senhaHash = await bcrypt.hash(SENHA_DEV, SALT_ROUNDS)

  // ── Master: perfil global, sem empresa ───────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'master@treinasys.com.br' },
    create: {
      nome: 'Master TreinaSys',
      email: 'master@treinasys.com.br',
      senhaHash,
      role: Role.MASTER,
      tenantId: null,
      ativo: true,
      precisaTrocarSenha: false,
    },
    update: {},
  })
  console.log('  usuário MASTER')

  // ── Empresa de demonstração ──────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'rpz-transportes' },
    create: {
      nome: 'RPZ Transportes',
      razaoSocial: 'RPZ Transportes Ltda',
      slug: 'rpz-transportes',
      status: TenantStatus.ATIVO,
      plano: PlanTier.PROFISSIONAL,
      limiteMotoristasAtivos: 200,
      // Limite de cursos existe, mas nasce desligado. Combinado com o cliente.
      limiteCursosAtivo: false,
      prefixoCertificado: 'RPZ',
    },
    update: {},
  })
  console.log(`  empresa ${tenant.nome}`)

  // ── Uma equipe e um usuário por perfil ───────────────────────────────────
  const equipe = await prisma.team.upsert({
    where: { tenantId_nome: { tenantId: tenant.id, nome: 'Frota Sul' } },
    create: { tenantId: tenant.id, nome: 'Frota Sul', descricao: 'Motoristas da operação sul' },
    update: {},
  })

  const usuarios: Array<{ nome: string; email: string; role: Role; cpf?: string; teamId?: string }> = [
    { nome: 'Admin RPZ', email: 'admin@rpz.com.br', role: Role.ADMIN },
    { nome: 'Gestor RPZ', email: 'gestor@rpz.com.br', role: Role.GESTOR, teamId: equipe.id },
    { nome: 'Instrutor RPZ', email: 'instrutor@rpz.com.br', role: Role.INSTRUTOR },
    {
      nome: 'Motorista Teste',
      email: 'motorista@rpz.com.br',
      role: Role.COLABORADOR,
      // CPF só dígitos: é assim que o login compara.
      cpf: '12345678901',
      teamId: equipe.id,
    },
  ]

  for (const dados of usuarios) {
    await prisma.user.upsert({
      where: { email: dados.email },
      create: {
        tenantId: tenant.id,
        nome: dados.nome,
        email: dados.email,
        cpf: dados.cpf ?? null,
        senhaHash,
        role: dados.role,
        teamId: dados.teamId ?? null,
        ativo: true,
        precisaTrocarSenha: false,
      },
      update: {},
    })
    console.log(`  usuário ${dados.role.padEnd(11)} ${dados.email}`)
  }

  // O gestor da equipe é o próprio usuário GESTOR.
  const gestor = await prisma.user.findUnique({ where: { email: 'gestor@rpz.com.br' } })
  if (gestor) {
    await prisma.team.update({ where: { id: equipe.id }, data: { gestorId: gestor.id } })
  }

  // ── Formulário de reação padrão, com as 13 categorias do Plano Mestre ─────
  const formulario = await prisma.reactionForm.findFirst({
    where: { tenantId: tenant.id, padrao: true },
  })

  if (!formulario) {
    await prisma.reactionForm.create({
      data: {
        tenantId: tenant.id,
        nome: 'Avaliação de Reação padrão',
        descricao: 'As 13 categorias previstas no Plano Mestre',
        padrao: true,
        ativo: true,
        questoes: {
          create: CATEGORIAS_REACAO.map((item, indice) => ({
            tenantId: tenant.id,
            categoria: item.categoria,
            texto: item.texto,
            escala: item.escala,
            obrigatoria: item.escala !== ReactionScale.TEXTO_LIVRE,
            ordem: indice + 1,
          })),
        },
      },
    })
    console.log(`  formulário de reação (${CATEGORIAS_REACAO.length} categorias)`)
  }

  console.log('\nPronto.')
  console.log(`\n  Senha de todos os usuários de desenvolvimento: ${SENHA_DEV}`)
  console.log('  O motorista também entra pelo CPF 12345678901\n')
}

main()
  .catch((erro) => {
    console.error('Falha ao semear o banco:', erro)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
