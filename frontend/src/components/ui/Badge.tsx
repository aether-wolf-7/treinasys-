import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tom = 'ok' | 'alerta' | 'perigo' | 'info' | 'neutro'

interface Props {
  tom?: Tom
  children: ReactNode
  className?: string
}

/**
 * Pilula de status. Segue o padrao do painel do cliente: fundo da cor a 12% de
 * opacidade e texto na cor cheia, o que mantem contraste no tema escuro.
 */
const TONS: Record<Tom, string> = {
  ok: 'bg-ok/12 text-ok',
  alerta: 'bg-warn/12 text-warn',
  perigo: 'bg-danger/12 text-danger',
  info: 'bg-primary/12 text-accent',
  neutro: 'bg-white/8 text-muted',
}

export function Badge({ tom = 'neutro', children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap',
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  )
}
