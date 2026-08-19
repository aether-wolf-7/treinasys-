import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface Props {
  children: ReactNode
  className?: string
  titulo?: string
  descricao?: string
  acao?: ReactNode
}

/**
 * Superficie padrao do sistema. Usa o efeito de vidro da classe .superficie-vidro,
 * que reproduz o card do painel do cliente (fundo translucido + blur + borda 1px).
 */
export function Card({ children, className, titulo, descricao, acao }: Props) {
  return (
    <section className={cn('superficie-vidro p-4 sm:p-5', className)}>
      {(titulo || acao) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-base font-semibold text-ink">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-sm text-muted">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}
