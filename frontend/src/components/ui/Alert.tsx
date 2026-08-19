import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tom = 'ok' | 'alerta' | 'erro' | 'info'

interface Props {
  tom?: Tom
  titulo?: string
  children: ReactNode
  className?: string
}

const TONS: Record<Tom, string> = {
  ok: 'bg-ok/12 text-ok border-ok/35',
  alerta: 'bg-warn/12 text-warn border-warn/35',
  erro: 'bg-danger/12 text-danger border-danger/35',
  info: 'bg-primary/12 text-accent border-primary/35',
}

export function Alert({ tom = 'info', titulo, children, className }: Props) {
  return (
    <div
      role={tom === 'erro' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm', TONS[tom], className)}
    >
      {titulo && <p className="mb-0.5 font-semibold">{titulo}</p>}
      <div className={cn(titulo && 'opacity-90')}>{children}</div>
    </div>
  )
}
