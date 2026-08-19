import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api, ErroApi } from '../lib/api'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { Icone } from '../components/layout/navegacao'

interface Resumo {
  usuariosAtivos: number
  motoristas: number
  gestores: number
  instrutores: number
  equipes: number
  treinamentosPublicados: number
  turmasAgendadas: number
  matriculasEmAndamento: number
  concluidosNoMes: number
  certificadosValidos: number
  vencendoEm30Dias: number
  vencidos: number
}

export function Dashboard() {
  const { usuario } = useAuth()
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true

    api
      .get<Resumo>('/dashboard/resumo')
      .then((dados) => {
        if (ativo) setResumo(dados)
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof ErroApi ? e.message : 'Nao foi possivel carregar o painel')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const primeiroNome = usuario?.nome.split(' ')[0] ?? ''

  // Cobertura: proporcao de motoristas com pelo menos um certificado valido.
  // Enquanto nao houver treinamento publicado, nao ha o que cobrir, e mostrar
  // "0%" passaria a ideia errada de que alguem esta em falta.
  const semTreinamentos = (resumo?.treinamentosPublicados ?? 0) === 0
  const cobertura =
    resumo && resumo.motoristas > 0 && !semTreinamentos
      ? Math.round((resumo.certificadosValidos / resumo.motoristas) * 100)
      : null

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Bom trabalho, {primeiroNome}</h1>
        <p className="mt-1 text-muted">
          {usuario?.tenant?.nome ?? 'Visao geral da plataforma'}
        </p>
      </header>

      {erro && (
        <Alert tom="erro" className="mb-6">
          {erro}
        </Alert>
      )}

      {/* Indicadores de conformidade: os mesmos do painel atual do cliente. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          rotulo="Motoristas ativos"
          valor={resumo?.motoristas ?? null}
          icone={Icone.usuarios}
          tom="info"
          carregando={carregando}
        />
        <StatCard
          rotulo="Certificados em dia"
          valor={resumo ? resumo.certificadosValidos - resumo.vencendoEm30Dias : null}
          icone={Icone.certificados}
          tom="ok"
          carregando={carregando}
        />
        <StatCard
          rotulo="Vencendo em 30 dias"
          valor={resumo?.vencendoEm30Dias ?? null}
          icone={Icone.alertas}
          tom="alerta"
          carregando={carregando}
        />
        <StatCard
          rotulo="Vencidos"
          valor={resumo?.vencidos ?? null}
          icone={Icone.tempos}
          tom="perigo"
          carregando={carregando}
        />
      </div>

      {semTreinamentos && !carregando && (
        <Alert tom="info" titulo="Nenhum treinamento publicado ainda" className="mt-4">
          Os indicadores de conformidade comecam a contar assim que o primeiro treinamento for
          publicado e os motoristas forem matriculados.
        </Alert>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card titulo="Cadastro" descricao="Pessoas e estrutura da empresa" className="lg:col-span-1">
          <dl className="space-y-3">
            <Linha rotulo="Usuarios ativos" valor={resumo?.usuariosAtivos} carregando={carregando} />
            <Linha rotulo="Motoristas" valor={resumo?.motoristas} carregando={carregando} />
            <Linha rotulo="Gestores" valor={resumo?.gestores} carregando={carregando} />
            <Linha rotulo="Instrutores" valor={resumo?.instrutores} carregando={carregando} />
            <Linha rotulo="Equipes" valor={resumo?.equipes} carregando={carregando} />
          </dl>
        </Card>

        <Card titulo="Treinamentos" descricao="Atividade no periodo" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Linha
              rotulo="Publicados"
              valor={resumo?.treinamentosPublicados}
              carregando={carregando}
            />
            <Linha
              rotulo="Em andamento"
              valor={resumo?.matriculasEmAndamento}
              carregando={carregando}
            />
            <Linha
              rotulo="Concluidos no mes"
              valor={resumo?.concluidosNoMes}
              carregando={carregando}
            />
            <Linha
              rotulo="Turmas presenciais agendadas"
              valor={resumo?.turmasAgendadas}
              carregando={carregando}
            />
            {cobertura !== null && (
              <Linha rotulo="Cobertura" valor={cobertura} sufixo="%" carregando={carregando} />
            )}
          </dl>
        </Card>
      </div>
    </div>
  )
}

function Linha({
  rotulo,
  valor,
  sufixo,
  carregando,
}: {
  rotulo: string
  valor: number | undefined
  sufixo?: string
  carregando: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
      <dt className="text-sm text-muted">{rotulo}</dt>
      <dd className="text-lg font-bold tabular-nums">
        {carregando ? <span className="text-faint">—</span> : (valor ?? 0)}
        {sufixo && !carregando && <span className="text-sm">{sufixo}</span>}
      </dd>
    </div>
  )
}
