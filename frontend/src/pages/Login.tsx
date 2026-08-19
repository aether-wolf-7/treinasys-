import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ErroApi } from '../lib/api'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/Logo'

/**
 * Os diferenciais sao os mesmos que o cliente ja escreveu na landing e na tela
 * de login dele. Manter o texto identico e proposital: quem chega pela landing
 * encontra a mesma promessa aqui dentro.
 */
const DIFERENCIAIS = [
  { titulo: 'Assinatura digital', texto: 'Cada conclusao fica assinada e registrada.' },
  { titulo: 'Certificados automaticos', texto: 'Emitidos na aprovacao, com QR de verificacao.' },
  { titulo: 'Video sem adiantamento', texto: 'O avanco so libera no tempo minimo, validado no servidor.' },
  { titulo: 'Controle de validade', texto: 'Alerta antes de vencer, por e-mail e WhatsApp.' },
]

export function Login() {
  const { usuario, entrar } = useAuth()
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) {
    return <Navigate to="/" replace />
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    try {
      await entrar(identificador.trim(), senha)
    } catch (e) {
      setErro(
        e instanceof ErroApi
          ? e.message
          : 'Nao foi possivel conectar ao servidor. Verifique sua internet.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Lado da marca. Escondido no celular para o motorista cair direto no formulario. */}
      <section className="relative hidden overflow-hidden border-r border-white/8 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.18),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Logo tamanho={40} />
            <span className="text-xl font-bold tracking-tight">TreinaSys</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl leading-tight font-bold text-balance">
              Treinamentos que geram <span className="text-accent">evidencia</span> de cada etapa
            </h1>
            <p className="mt-4 text-lg text-muted">
              Controle real, do inicio ao fim do treinamento.
            </p>

            <ul className="mt-10 space-y-4">
              {DIFERENCIAIS.map((item) => (
                <li key={item.titulo} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-accent">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3 8.5l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-semibold">{item.titulo}</span>
                    <span className="block text-sm text-muted">{item.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-faint">Gestao de treinamentos para o setor de transporte</p>
        </div>
      </section>

      {/* Lado do formulario */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo tamanho={36} />
            <span className="text-lg font-bold tracking-tight">TreinaSys</span>
          </div>

          <h2 className="text-2xl font-bold">Entrar</h2>
          <p className="mt-1 text-sm text-muted">Acesse com seu e-mail ou CPF.</p>

          <form onSubmit={aoEnviar} className="mt-7 space-y-4" noValidate>
            {erro && <Alert tom="erro">{erro}</Alert>}

            <Input
              rotulo="E-mail ou CPF"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              autoComplete="username"
              inputMode="email"
              autoFocus
              required
              placeholder="seu@email.com ou 000.000.000-00"
            />

            <Input
              rotulo="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              acaoDireita={
                <Button
                  type="button"
                  variante="fantasma"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="min-h-9 px-2.5 text-xs"
                >
                  {mostrarSenha ? 'ocultar' : 'mostrar'}
                </Button>
              }
            />

            <Button type="submit" tamanho="lg" larguraTotal carregando={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <a
            href="/recuperar-senha"
            className="mt-5 inline-block text-sm text-accent hover:underline"
          >
            Esqueci minha senha
          </a>
        </div>
      </section>
    </main>
  )
}
