import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NOME_DO_PERFIL } from '../../lib/tipos'
import { cn } from '../../lib/cn'
import { Logo } from '../Logo'
import { Button } from '../ui/Button'
import { menuDoPerfil } from './navegacao'

export function AppShell() {
  const { usuario, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const local = useLocation()

  // No celular o menu e uma gaveta. Trocar de pagina tem que fechar sozinho.
  useEffect(() => {
    setMenuAberto(false)
  }, [local.pathname])

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  if (!usuario) return null

  const itens = menuDoPerfil(usuario.role)
  const iniciais = usuario.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Fundo escurecido atras da gaveta no celular */}
      {menuAberto && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-white/8 bg-surface',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          menuAberto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-5">
          <Logo tamanho={30} />
          <span className="font-bold tracking-tight">TreinaSys</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Menu principal">
          <ul className="space-y-0.5">
            {itens.map((item) => (
              <li key={item.para}>
                <NavLink
                  to={item.para}
                  end={item.para === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/12 text-accent'
                        : 'text-muted hover:bg-white/5 hover:text-ink',
                    )
                  }
                >
                  {item.icone}
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-accent">
              {iniciais}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{usuario.nome}</span>
              <span className="block truncate text-xs text-muted">
                {NOME_DO_PERFIL[usuario.role]}
                {usuario.tenant && ` · ${usuario.tenant.nome}`}
              </span>
            </span>
          </div>
          <Button
            variante="fantasma"
            larguraTotal
            onClick={() => void sair()}
            className="mt-1 justify-start"
          >
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/8 bg-canvas/80 px-4 backdrop-blur-md lg:px-8">
          <Button
            variante="fantasma"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="lg:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </Button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <Logo tamanho={26} />
            <span className="font-bold tracking-tight">TreinaSys</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
