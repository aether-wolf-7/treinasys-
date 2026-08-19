import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

type Tom = 'neutro' | 'ok' | 'alerta' | 'perigo' | 'info'

interface Props {
  rotulo: string
  valor: number | string | null
  sufixo?: string
  icone?: ReactNode
  tom?: Tom
  carregando?: boolean
  /** Quando informado, o card vira botao e leva para a lista por tras do numero. */
  aoClicar?: () => void
}

const TONS: Record<Tom, { icone: string; valor: string }> = {
  neutro: { icone: 'bg-white/8 text-muted', valor: 'text-ink' },
  ok: { icone: 'bg-ok/12 text-ok', valor: 'text-ok' },
  alerta: { icone: 'bg-warn/12 text-warn', valor: 'text-warn' },
  perigo: { icone: 'bg-danger/12 text-danger', valor: 'text-danger' },
  info: { icone: 'bg-primary/12 text-accent', valor: 'text-accent' },
}

/**
 * Indicador do painel. Reproduz os KPIs que o cliente ja tem (Total ativos,
 * Em dia, Vencendo, Vencidos, Cobertura) e, quando recebe `aoClicar`, permite
 * abrir a lista que esta por tras do numero.
 */
export function StatCard({
  rotulo,
  valor,
  sufixo,
  icone,
  tom = 'neutro',
  carregando = false,
  aoClicar,
}: Props) {
  const cores = TONS[tom]
  const Elemento = aoClicar ? 'button' : 'div'

  return (
    <Elemento
      onClick={aoClicar}
      className={cn(
        'superficie-vidro flex items-center gap-3 p-4 text-left w-full',
        aoClicar && 'cursor-pointer transition-colors hover:border-white/16 hover:bg-white/4',
      )}
    >
      {icone && (
        <span className={cn('grid size-[46px] shrink-0 place-items-center rounded-xl', cores.icone)}>
          {icone}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-xs font-medium tracking-wide text-muted uppercase">{rotulo}</span>
        <span className={cn('mt-0.5 flex items-baseline gap-1 text-2xl font-bold', cores.valor)}>
          {carregando ? (
            <Spinner tamanho={20} className="text-muted" />
          ) : (
            <>
              {valor ?? '—'}
              {sufixo && valor !== null && <span className="text-sm font-semibold">{sufixo}</span>}
            </>
          )}
        </span>
      </span>
    </Elemento>
  )
}
