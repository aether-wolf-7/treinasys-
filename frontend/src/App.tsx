import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { TelaCarregando } from './components/TelaCarregando'
import { Dashboard } from './pages/Dashboard'
import { EmBreve } from './pages/EmBreve'
import { Login } from './pages/Login'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { NIVEL, type Perfil } from './lib/tipos'

function RotaProtegida({ minimo }: { minimo?: Perfil }) {
  const { usuario, carregando } = useAuth()

  if (carregando) return <TelaCarregando />
  if (!usuario) return <Navigate to="/login" replace />
  if (minimo && NIVEL[usuario.role] < NIVEL[minimo]) return <Navigate to="/" replace />

  return <AppShell />
}

/** O inicio depende do perfil: gestao ve o painel, motorista ve os treinamentos dele. */
function Inicio() {
  const { usuario } = useAuth()

  if (usuario?.role === 'COLABORADOR') {
    return (
      <EmBreve
        titulo="Meus treinamentos"
        descricao="Seus treinamentos, o progresso de cada um e os prazos."
        semana="a semana do motor de treinamento"
        itens={[
          'Lista de treinamentos com status e progresso',
          'Retomar de onde parou, em qualquer aparelho',
          'Aulas com slides, imagens e video',
          'Fixacao ao fim de cada bloco e prova final',
          'Assinatura digital e certificado ao ser aprovado',
        ]}
      />
    )
  }

  return <Dashboard />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RotaProtegida />}>
            <Route index element={<Inicio />} />
            <Route
              path="certificados"
              element={
                <EmBreve
                  titulo="Meus certificados"
                  descricao="Todos os certificados emitidos no seu nome."
                  semana="a semana dos certificados"
                  itens={[
                    'Certificado em PDF com QR de verificacao',
                    'Pagina publica de conferencia, sem login',
                    'Data de emissao e de validade',
                    'Historico de renovacoes',
                  ]}
                />
              }
            />
          </Route>

          <Route element={<RotaProtegida minimo="GESTOR" />}>
            <Route
              path="alertas"
              element={
                <EmBreve
                  titulo="Alertas de vencimento"
                  descricao="Quem esta vencendo e quem ja venceu."
                  semana="a semana de paineis e notificacoes"
                  itens={[
                    'Lista por motorista e por treinamento',
                    'Faixas de 30, 15, 7 e 1 dia antes de vencer',
                    'Sugestao automatica do curso de reciclagem certo',
                    'Disparo por e-mail e WhatsApp com regras configuraveis',
                  ]}
                />
              }
            />
            <Route
              path="historico"
              element={
                <EmBreve
                  titulo="Historico"
                  descricao="Tudo que cada motorista ja fez."
                  semana="a semana de paineis e relatorios"
                  itens={[
                    'Filtro por motorista, treinamento, periodo e status',
                    'Nota, tempo gasto e data de conclusao',
                    'Acesso ao certificado e ao gabarito de cada conclusao',
                    'Exportacao em PDF e Excel',
                  ]}
                />
              }
            />
            <Route
              path="reacao"
              element={
                <EmBreve
                  titulo="Avaliacao de reacao"
                  descricao="O que os motoristas acharam do treinamento."
                  semana="a semana de avaliacoes"
                  itens={[
                    'As 13 categorias previstas no Plano Mestre',
                    'Escala Likert, NPS e perguntas abertas',
                    'Medias por categoria e por treinamento',
                    'Comentarios abertos, na integra',
                  ]}
                />
              }
            />
            <Route
              path="tempos"
              element={
                <EmBreve
                  titulo="Relatorio de tempos"
                  descricao="Quanto tempo cada um levou, slide a slide."
                  semana="a semana do motor de treinamento"
                  itens={[
                    'Tempo por slide, validado no servidor',
                    'Tempo total por motorista e por treinamento',
                    'Identificacao de quem apenas passou o conteudo',
                    'Evidencia auditavel em caso de contestacao',
                  ]}
                />
              }
            />
            <Route
              path="presenciais"
              element={
                <EmBreve
                  titulo="Treinamentos presenciais"
                  descricao="Turmas em sala, com a mesma evidencia do EAD."
                  semana="a semana do presencial"
                  itens={[
                    'Turma com data, instrutor e lista de participantes',
                    'Modo apresentacao para projetar em sala, sem anti-skip',
                    'Presenca confirmada por assinatura digital',
                    'Prova no celular de cada participante, com sorteio de questoes',
                    'Certificado e controle de validade iguais aos do EAD',
                  ]}
                />
              }
            />
          </Route>

          <Route element={<RotaProtegida minimo="ADMIN" />}>
            <Route
              path="usuarios"
              element={
                <EmBreve
                  titulo="Usuarios"
                  descricao="Motoristas e demais usuarios da empresa."
                  semana="a proxima etapa do backend"
                  itens={[
                    'Cadastro com nome, CPF, e-mail, funcao e setor',
                    'Importacao em lote por CSV, com validacao',
                    'Ativar e inativar sem perder o historico',
                    'Vinculo com equipes e permissao de reinicio de treinamento',
                  ]}
                />
              }
            />
            <Route
              path="gestores"
              element={
                <EmBreve
                  titulo="Gestores"
                  descricao="Quem acompanha cada equipe."
                  semana="a proxima etapa do backend"
                  itens={[
                    'Cadastro de gestores e instrutores',
                    'Vinculo com equipes e setores',
                    'Permissoes por nivel de perfil',
                    'Redefinicao de senha pelo administrador',
                  ]}
                />
              }
            />
          </Route>

          <Route element={<RotaProtegida minimo="MASTER" />}>
            <Route
              path="empresas"
              element={
                <EmBreve
                  titulo="Empresas"
                  descricao="Painel Master, visao de todas as empresas."
                  semana="a proxima etapa do backend"
                  itens={[
                    'Cadastro de empresas com CNPJ e plano',
                    'Ativar, suspender e trocar plano',
                    'Limite de motoristas ativos por plano',
                    'Auditoria global e configuracoes do sistema',
                  ]}
                />
              }
            />
          </Route>

          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
