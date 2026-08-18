-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'ADMIN', 'GESTOR', 'INSTRUTOR', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ATIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('BASICO', 'PROFISSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TrainingOrigin" AS ENUM ('PLATAFORMA', 'PROPRIO');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('EAD', 'PRESENCIAL', 'AMBOS');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "SlideType" AS ENUM ('TEXTO', 'IMAGEM', 'VIDEO', 'PDF', 'EMBED', 'HTML');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'REPROVADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('FIXACAO', 'PROVA_FINAL');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('MULTIPLA_ESCOLHA', 'VERDADEIRO_FALSO');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('EM_ANDAMENTO', 'APROVADO', 'REPROVADO', 'ABANDONADO');

-- CreateEnum
CREATE TYPE "CompletionOrigin" AS ENUM ('EAD', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALIDO', 'EXPIRADO', 'REVOGADO');

-- CreateEnum
CREATE TYPE "TurmaStatus" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('AUSENTE', 'PRESENTE', 'JUSTIFICADO');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('MATRICULA', 'LEMBRETE_PENDENTE', 'PRAZO_PROXIMO', 'CONCLUSAO', 'CERTIFICADO_EMITIDO', 'VENCIMENTO_PROXIMO', 'VENCIDO', 'AVALIACAO_REACAO', 'AVALIACAO_EFICACIA', 'RECUPERACAO_SENHA', 'TURMA_AGENDADA');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ReactionScale" AS ENUM ('LIKERT_5', 'NPS_0_10', 'SIM_NAO', 'TEXTO_LIVRE');

-- CreateEnum
CREATE TYPE "EfficacyStatus" AS ENUM ('PENDENTE', 'RESPONDIDA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "EfficacyResult" AS ENUM ('SATISFATORIO', 'PARCIAL', 'INSATISFATORIO');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('USO', 'PRIVACIDADE', 'CONSENTIMENTO_LGPD');

-- CreateEnum
CREATE TYPE "TermTemplateKind" AS ENUM ('DIGITAL', 'FISICO');

-- CreateEnum
CREATE TYPE "EnrollmentPhase" AS ENUM ('CONTEUDO', 'FIXACAO', 'QUIZ', 'RESULTADO', 'ASSINATURA', 'REACAO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "DataRequestKind" AS ENUM ('EXPORTACAO', 'EXCLUSAO');

-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'ATENDIDA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGEM', 'VIDEO', 'PDF', 'DOCUMENTO', 'LOGO', 'TEMPLATE_CERTIFICADO', 'ASSINATURA');

-- CreateEnum
CREATE TYPE "ImportKind" AS ENUM ('USUARIOS', 'QUESTOES', 'MATRICULAS');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU');

-- CreateEnum
CREATE TYPE "ProgressEventType" AS ENUM ('VIEW_START', 'HEARTBEAT', 'VIEW_END');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "razao_social" TEXT,
    "cnpj" TEXT,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
    "plano" "PlanTier" NOT NULL DEFAULT 'BASICO',
    "limite_motoristas_ativos" INTEGER NOT NULL DEFAULT 50,
    "limite_cursos_ativo" BOOLEAN NOT NULL DEFAULT false,
    "limite_cursos" INTEGER,
    "email_contato" TEXT,
    "telefone" TEXT,
    "logo_url" TEXT,
    "cor_primaria" TEXT,
    "prefixo_certificado" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "gestor_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "matricula" TEXT,
    "cargo" TEXT,
    "team_id" UUID,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "falhas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMP(3),
    "ultimo_login_em" TIMESTAMP(3),
    "precisa_trocar_senha" BOOLEAN NOT NULL DEFAULT true,
    "senha_alterada_em" TIMESTAMP(3),
    "permitir_reinicio" BOOLEAN NOT NULL DEFAULT false,
    "bypass_anti_skip" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "identificador" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "motivo" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "codigo" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "origem" "TrainingOrigin" NOT NULL DEFAULT 'PROPRIO',
    "modalidade" "Modalidade" NOT NULL DEFAULT 'EAD',
    "status" "TrainingStatus" NOT NULL DEFAULT 'RASCUNHO',
    "capa_url" TEXT,
    "carga_horaria_minutos" INTEGER NOT NULL DEFAULT 60,
    "validade_meses" INTEGER,
    "nota_minima" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "tentativas_maximas" INTEGER NOT NULL DEFAULT 3,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "instrutor_nome" TEXT,
    "funcao_alvo" TEXT,
    "exige_assinatura" BOOLEAN NOT NULL DEFAULT true,
    "qtd_questoes_fixacao" INTEGER NOT NULL DEFAULT 3,
    "qtd_questoes_quiz" INTEGER NOT NULL DEFAULT 10,
    "certificate_template_id" UUID,
    "training_group_id" UUID,
    "ordem_no_grupo" INTEGER,
    "anti_skip_ativo" BOOLEAN NOT NULL DEFAULT true,
    "reciclagem_de_id" UUID,
    "reaction_form_id" UUID,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "publicado_em" TIMESTAMP(3),
    "criado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "training_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "lesson_id" UUID NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" "SlideType" NOT NULL DEFAULT 'TEXTO',
    "titulo" TEXT,
    "conteudo" JSONB NOT NULL DEFAULT '{}',
    "media_url" TEXT,
    "tempo_minimo_segundos" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "training_id" UUID NOT NULL,
    "lesson_id" UUID,
    "tipo" "QuestionKind" NOT NULL DEFAULT 'PROVA_FINAL',
    "formato" "QuestionFormat" NOT NULL DEFAULT 'MULTIPLA_ESCOLHA',
    "bloco_aula" INTEGER,
    "enunciado" TEXT NOT NULL,
    "explicacao" TEXT,
    "peso" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "ordem" INTEGER,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "question_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "turma_id" UUID,
    "ciclo" INTEGER NOT NULL DEFAULT 1,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'NAO_INICIADO',
    "origem" "CompletionOrigin" NOT NULL DEFAULT 'EAD',
    "fase" "EnrollmentPhase" NOT NULL DEFAULT 'CONTEUDO',
    "matriculado_por_id" UUID,
    "matriculado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo_em" TIMESTAMP(3),
    "iniciado_em" TIMESTAMP(3),
    "concluido_em" TIMESTAMP(3),
    "expira_em" TIMESTAMP(3),
    "progresso_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ultimo_slide_id" UUID,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "reinicio_autorizado" BOOLEAN NOT NULL DEFAULT false,
    "reinicio_autorizado_por_id" UUID,
    "reinicio_autorizado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slide_progress" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "enrollment_id" UUID NOT NULL,
    "slide_id" UUID NOT NULL,
    "tempo_acumulado_segundos" INTEGER NOT NULL DEFAULT 0,
    "primeiro_acesso_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acesso_em" TIMESTAMP(3) NOT NULL,
    "concluido_em" TIMESTAMP(3),

    CONSTRAINT "slide_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "enrollment_id" UUID NOT NULL,
    "slide_id" UUID NOT NULL,
    "tipo" "ProgressEventType" NOT NULL,
    "delta_segundos" INTEGER NOT NULL DEFAULT 0,
    "servidor_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "progress_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "enrollment_id" UUID NOT NULL,
    "tipo" "QuestionKind" NOT NULL DEFAULT 'PROVA_FINAL',
    "numero" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "seed" TEXT NOT NULL,
    "nota" DECIMAL(5,2),
    "aprovado" BOOLEAN,
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_attempts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "quiz_attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_id" UUID,
    "resposta_texto" TEXT,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "tempo_segundos" INTEGER NOT NULL DEFAULT 0,
    "respondido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "turma_id" UUID,
    "origem" "CompletionOrigin" NOT NULL DEFAULT 'EAD',
    "nota" DECIMAL(5,2),
    "carga_horaria_minutos" INTEGER NOT NULL,
    "concluido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valido_ate" TIMESTAMP(3),
    "assinatura_id" UUID,
    "gabarito_url" TEXT,
    "aceite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enrollment_id" UUID,
    "imagem_url" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "assinado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "mapeamento" JSONB NOT NULL DEFAULT '{}',
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "completion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "template_id" UUID,
    "codigo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALIDO',
    "emitido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valido_ate" TIMESTAMP(3),
    "revogado_em" TIMESTAMP(3),
    "revogado_por_id" UUID,
    "motivo_revogacao" TEXT,
    "verificacoes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_verifications" (
    "id" UUID NOT NULL,
    "certificate_id" UUID NOT NULL,
    "verificado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "certificate_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "codigo" TEXT,
    "titulo" TEXT NOT NULL,
    "instrutor_id" UUID,
    "instrutor_nome" TEXT,
    "local" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "carga_horaria_minutos" INTEGER,
    "vagas" INTEGER,
    "status" "TurmaStatus" NOT NULL DEFAULT 'AGENDADA',
    "observacoes" TEXT,
    "criado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_participants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "turma_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "presenca" "AttendanceStatus" NOT NULL DEFAULT 'AUSENTE',
    "confirmado_em" TIMESTAMP(3),
    "assinatura_id" UUID,
    "observacao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_forms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reaction_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_questions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "form_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "escala" "ReactionScale" NOT NULL DEFAULT 'LIKERT_5',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "reaction_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_responses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "form_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "respondido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reaction_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_answers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "valor_numerico" INTEGER,
    "valor_texto" TEXT,

    CONSTRAINT "reaction_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "efficacy_evaluations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "completion_id" UUID NOT NULL,
    "colaborador_id" UUID NOT NULL,
    "avaliador_id" UUID,
    "training_id" UUID NOT NULL,
    "janela_dias" INTEGER NOT NULL DEFAULT 60,
    "disponivel_em" TIMESTAMP(3) NOT NULL,
    "prazo_em" TIMESTAMP(3),
    "status" "EfficacyStatus" NOT NULL DEFAULT 'PENDENTE',
    "respondido_em" TIMESTAMP(3),
    "nota_geral" DECIMAL(5,2),
    "resultado" "EfficacyResult",
    "plano_acao" TEXT,
    "plano_acao_prazo" TIMESTAMP(3),
    "plano_acao_responsavel_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "efficacy_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "efficacy_answers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "evaluation_id" UUID NOT NULL,
    "bloco" TEXT NOT NULL,
    "questao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "efficacy_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "evento" "NotificationEvent" NOT NULL,
    "canal" "NotificationChannel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "offset_dias" INTEGER NOT NULL DEFAULT 0,
    "hora_envio" TEXT NOT NULL DEFAULT '08:00',
    "destinatarios" JSONB NOT NULL DEFAULT '["COLABORADOR"]',
    "template_assunto" TEXT,
    "template_corpo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rule_id" UUID,
    "evento" "NotificationEvent" NOT NULL,
    "canal" "NotificationChannel" NOT NULL,
    "destinatario_id" UUID,
    "destino_endereco" TEXT NOT NULL,
    "assunto" TEXT,
    "corpo" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "agendado_para" TIMESTAMP(3) NOT NULL,
    "enviado_em" TIMESTAMP(3),
    "provider_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT,
    "antes" JSONB,
    "depois" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_documents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "nome" TEXT NOT NULL,
    "tipo" "ConsentKind" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_versions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "document_id" UUID NOT NULL,
    "versao" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "publicado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_acceptances" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "consent_version_id" UUID NOT NULL,
    "aceito_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "consent_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_groups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_training_id" UUID,
    "term_template_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TermTemplateKind" NOT NULL DEFAULT 'DIGITAL',
    "arquivo_url" TEXT NOT NULL,
    "mapeamento" JSONB NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "term_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsibility_terms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "training_group_id" UUID NOT NULL,
    "template_id" UUID,
    "completion_id" UUID,
    "assinatura_id" UUID,
    "arquivo_url" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "emitido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "responsibility_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "jwt_expiracao_horas" INTEGER NOT NULL DEFAULT 8,
    "refresh_expiracao_dias" INTEGER NOT NULL DEFAULT 30,
    "max_tentativas_login" INTEGER NOT NULL DEFAULT 5,
    "bloqueio_minutos" INTEGER NOT NULL DEFAULT 30,
    "senha_min_caracteres" INTEGER NOT NULL DEFAULT 8,
    "senha_exige_maiuscula" BOOLEAN NOT NULL DEFAULT true,
    "senha_exige_numero" BOOLEAN NOT NULL DEFAULT true,
    "senha_exige_simbolo" BOOLEAN NOT NULL DEFAULT false,
    "alerta_vencimento_dias" INTEGER NOT NULL DEFAULT 30,
    "atualizado_por_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plano_anterior" "PlanTier",
    "plano_novo" "PlanTier" NOT NULL,
    "limite_anterior" INTEGER,
    "limite_novo" INTEGER NOT NULL,
    "motivo" TEXT,
    "alterado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tipo" "DataRequestKind" NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'ABERTA',
    "motivo" TEXT,
    "arquivo_url" TEXT,
    "solicitado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendido_em" TIMESTAMP(3),
    "atendido_por_id" UUID,
    "observacao" TEXT,

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "tipo" "MediaKind" NOT NULL,
    "nome_original" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "hash" TEXT,
    "enviado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tipo" "ImportKind" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDENTE',
    "arquivo_url" TEXT NOT NULL,
    "total_linhas" INTEGER NOT NULL DEFAULT 0,
    "sucesso" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "relatorio" JSONB NOT NULL DEFAULT '[]',
    "criado_por_id" UUID,
    "iniciado_em" TIMESTAMP(3),
    "finalizado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "teams_tenant_id_idx" ON "teams"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_tenant_id_nome_key" ON "teams"("tenant_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE INDEX "users_tenant_id_ativo_idx" ON "users"("tenant_id", "ativo");

-- CreateIndex
CREATE INDEX "users_cpf_idx" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_cpf_key" ON "users"("tenant_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_jti_key" ON "revoked_tokens"("jti");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "revoked_tokens_user_id_idx" ON "revoked_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "login_attempts_identificador_created_at_idx" ON "login_attempts"("identificador", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_ip_created_at_idx" ON "login_attempts"("ip", "created_at");

-- CreateIndex
CREATE INDEX "trainings_tenant_id_status_idx" ON "trainings"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "trainings_tenant_id_modalidade_idx" ON "trainings"("tenant_id", "modalidade");

-- CreateIndex
CREATE INDEX "trainings_reciclagem_de_id_idx" ON "trainings"("reciclagem_de_id");

-- CreateIndex
CREATE UNIQUE INDEX "trainings_tenant_id_codigo_key" ON "trainings"("tenant_id", "codigo");

-- CreateIndex
CREATE INDEX "lessons_tenant_id_idx" ON "lessons"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_training_id_ordem_key" ON "lessons"("training_id", "ordem");

-- CreateIndex
CREATE INDEX "slides_tenant_id_idx" ON "slides"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "slides_lesson_id_ordem_key" ON "slides"("lesson_id", "ordem");

-- CreateIndex
CREATE INDEX "questions_tenant_id_idx" ON "questions"("tenant_id");

-- CreateIndex
CREATE INDEX "questions_training_id_tipo_ativa_idx" ON "questions"("training_id", "tipo", "ativa");

-- CreateIndex
CREATE INDEX "question_options_tenant_id_idx" ON "question_options"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_ordem_key" ON "question_options"("question_id", "ordem");

-- CreateIndex
CREATE INDEX "enrollments_tenant_id_status_idx" ON "enrollments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "enrollments_tenant_id_user_id_idx" ON "enrollments"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "enrollments_tenant_id_expira_em_idx" ON "enrollments"("tenant_id", "expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_tenant_id_user_id_training_id_ciclo_key" ON "enrollments"("tenant_id", "user_id", "training_id", "ciclo");

-- CreateIndex
CREATE INDEX "slide_progress_tenant_id_idx" ON "slide_progress"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "slide_progress_enrollment_id_slide_id_key" ON "slide_progress"("enrollment_id", "slide_id");

-- CreateIndex
CREATE INDEX "progress_events_enrollment_id_servidor_em_idx" ON "progress_events"("enrollment_id", "servidor_em");

-- CreateIndex
CREATE INDEX "progress_events_tenant_id_idx" ON "progress_events"("tenant_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_tenant_id_idx" ON "quiz_attempts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_enrollment_id_tipo_numero_key" ON "quiz_attempts"("enrollment_id", "tipo", "numero");

-- CreateIndex
CREATE INDEX "question_attempts_tenant_id_idx" ON "question_attempts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_attempts_quiz_attempt_id_question_id_key" ON "question_attempts"("quiz_attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "completions_enrollment_id_key" ON "completions"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "completions_assinatura_id_key" ON "completions"("assinatura_id");

-- CreateIndex
CREATE INDEX "completions_tenant_id_concluido_em_idx" ON "completions"("tenant_id", "concluido_em");

-- CreateIndex
CREATE INDEX "completions_tenant_id_valido_ate_idx" ON "completions"("tenant_id", "valido_ate");

-- CreateIndex
CREATE INDEX "signatures_tenant_id_user_id_idx" ON "signatures"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "certificate_templates_tenant_id_idx" ON "certificate_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_completion_id_key" ON "certificates"("completion_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_codigo_key" ON "certificates"("codigo");

-- CreateIndex
CREATE INDEX "certificates_tenant_id_status_idx" ON "certificates"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "certificates_tenant_id_valido_ate_idx" ON "certificates"("tenant_id", "valido_ate");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_tenant_id_numero_key" ON "certificates"("tenant_id", "numero");

-- CreateIndex
CREATE INDEX "certificate_verifications_certificate_id_verificado_em_idx" ON "certificate_verifications"("certificate_id", "verificado_em");

-- CreateIndex
CREATE INDEX "turmas_tenant_id_status_idx" ON "turmas"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "turmas_tenant_id_data_inicio_idx" ON "turmas"("tenant_id", "data_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_tenant_id_codigo_key" ON "turmas"("tenant_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "turma_participants_assinatura_id_key" ON "turma_participants"("assinatura_id");

-- CreateIndex
CREATE INDEX "turma_participants_tenant_id_idx" ON "turma_participants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "turma_participants_turma_id_user_id_key" ON "turma_participants"("turma_id", "user_id");

-- CreateIndex
CREATE INDEX "reaction_forms_tenant_id_idx" ON "reaction_forms"("tenant_id");

-- CreateIndex
CREATE INDEX "reaction_questions_tenant_id_idx" ON "reaction_questions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_questions_form_id_ordem_key" ON "reaction_questions"("form_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_responses_enrollment_id_key" ON "reaction_responses"("enrollment_id");

-- CreateIndex
CREATE INDEX "reaction_responses_tenant_id_training_id_idx" ON "reaction_responses"("tenant_id", "training_id");

-- CreateIndex
CREATE INDEX "reaction_answers_tenant_id_idx" ON "reaction_answers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_answers_response_id_question_id_key" ON "reaction_answers"("response_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "efficacy_evaluations_completion_id_key" ON "efficacy_evaluations"("completion_id");

-- CreateIndex
CREATE INDEX "efficacy_evaluations_tenant_id_status_idx" ON "efficacy_evaluations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "efficacy_evaluations_tenant_id_disponivel_em_idx" ON "efficacy_evaluations"("tenant_id", "disponivel_em");

-- CreateIndex
CREATE INDEX "efficacy_answers_tenant_id_idx" ON "efficacy_answers"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_rules_tenant_id_ativo_idx" ON "notification_rules"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "notification_rules_tenant_id_evento_canal_offset_dias_key" ON "notification_rules"("tenant_id", "evento", "canal", "offset_dias");

-- CreateIndex
CREATE INDEX "notification_logs_tenant_id_status_agendado_para_idx" ON "notification_logs"("tenant_id", "status", "agendado_para");

-- CreateIndex
CREATE INDEX "notification_logs_destinatario_id_idx" ON "notification_logs"("destinatario_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_criado_em_idx" ON "audit_logs"("tenant_id", "criado_em");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidade_id_idx" ON "audit_logs"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_criado_em_idx" ON "audit_logs"("user_id", "criado_em");

-- CreateIndex
CREATE INDEX "consent_documents_tenant_id_tipo_idx" ON "consent_documents"("tenant_id", "tipo");

-- CreateIndex
CREATE INDEX "consent_versions_tenant_id_idx" ON "consent_versions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_versions_document_id_versao_key" ON "consent_versions"("document_id", "versao");

-- CreateIndex
CREATE INDEX "consent_acceptances_tenant_id_idx" ON "consent_acceptances"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_acceptances_user_id_consent_version_id_key" ON "consent_acceptances"("user_id", "consent_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_groups_ultimo_training_id_key" ON "training_groups"("ultimo_training_id");

-- CreateIndex
CREATE INDEX "training_groups_tenant_id_ativo_idx" ON "training_groups"("tenant_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "training_groups_tenant_id_nome_key" ON "training_groups"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "term_templates_tenant_id_tipo_idx" ON "term_templates"("tenant_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "responsibility_terms_completion_id_key" ON "responsibility_terms"("completion_id");

-- CreateIndex
CREATE UNIQUE INDEX "responsibility_terms_assinatura_id_key" ON "responsibility_terms"("assinatura_id");

-- CreateIndex
CREATE INDEX "responsibility_terms_tenant_id_user_id_idx" ON "responsibility_terms"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "plan_history_tenant_id_criado_em_idx" ON "plan_history"("tenant_id", "criado_em");

-- CreateIndex
CREATE INDEX "data_requests_tenant_id_status_idx" ON "data_requests"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_chave_key" ON "media_assets"("chave");

-- CreateIndex
CREATE INDEX "media_assets_tenant_id_tipo_idx" ON "media_assets"("tenant_id", "tipo");

-- CreateIndex
CREATE INDEX "import_jobs_tenant_id_status_idx" ON "import_jobs"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_gestor_id_fkey" FOREIGN KEY ("gestor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_reciclagem_de_id_fkey" FOREIGN KEY ("reciclagem_de_id") REFERENCES "trainings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_reaction_form_id_fkey" FOREIGN KEY ("reaction_form_id") REFERENCES "reaction_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_training_group_id_fkey" FOREIGN KEY ("training_group_id") REFERENCES "training_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_matriculado_por_id_fkey" FOREIGN KEY ("matriculado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_reinicio_autorizado_por_id_fkey" FOREIGN KEY ("reinicio_autorizado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slide_progress" ADD CONSTRAINT "slide_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slide_progress" ADD CONSTRAINT "slide_progress_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_quiz_attempt_id_fkey" FOREIGN KEY ("quiz_attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completions" ADD CONSTRAINT "completions_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "completions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revogado_por_id_fkey" FOREIGN KEY ("revogado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_verifications" ADD CONSTRAINT "certificate_verifications_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_participants" ADD CONSTRAINT "turma_participants_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_participants" ADD CONSTRAINT "turma_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_participants" ADD CONSTRAINT "turma_participants_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_forms" ADD CONSTRAINT "reaction_forms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_questions" ADD CONSTRAINT "reaction_questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "reaction_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_responses" ADD CONSTRAINT "reaction_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "reaction_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_responses" ADD CONSTRAINT "reaction_responses_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_responses" ADD CONSTRAINT "reaction_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_responses" ADD CONSTRAINT "reaction_responses_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_answers" ADD CONSTRAINT "reaction_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "reaction_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction_answers" ADD CONSTRAINT "reaction_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "reaction_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "completions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_evaluations" ADD CONSTRAINT "efficacy_evaluations_plano_acao_responsavel_id_fkey" FOREIGN KEY ("plano_acao_responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "efficacy_answers" ADD CONSTRAINT "efficacy_answers_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "efficacy_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rules" ADD CONSTRAINT "notification_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_documents" ADD CONSTRAINT "consent_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_versions" ADD CONSTRAINT "consent_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "consent_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_acceptances" ADD CONSTRAINT "consent_acceptances_consent_version_id_fkey" FOREIGN KEY ("consent_version_id") REFERENCES "consent_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_ultimo_training_id_fkey" FOREIGN KEY ("ultimo_training_id") REFERENCES "trainings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_term_template_id_fkey" FOREIGN KEY ("term_template_id") REFERENCES "term_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_templates" ADD CONSTRAINT "term_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_training_group_id_fkey" FOREIGN KEY ("training_group_id") REFERENCES "training_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "term_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "completions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsibility_terms" ADD CONSTRAINT "responsibility_terms_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_history" ADD CONSTRAINT "plan_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
