import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  carregando?: boolean
  larguraTotal?: boolean
  iconeEsquerda?: ReactNode
}

const VARIANTES: Record<Variante, string> = {
  // O brilho azul embaixo do botao primario e do painel do cliente, nao e enfeite novo.
  primario:
    'bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] hover:bg-primary-dark active:translate-y-px',
  secundario: 'bg-transparent text-ink border border-white/8 hover:bg-white/5',
  fantasma: 'bg-transparent text-muted hover:text-ink hover:bg-white/5',
  perigo: 'bg-danger text-white hover:brightness-110 active:translate-y-px',
}

const TAMANHOS: Record<Tamanho, string> = {
  md: 'min-h-[44px] px-4 text-sm',
  // 52px e a area de toque que o cliente adotou. Funciona para dedo de motorista.
  lg: 'min-h-tap px-5 text-base',
}

export function Button({
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  larguraTotal = false,
  iconeEsquerda,
  className,
  children,
  disabled,
  ...resto
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-colors duration-150 cursor-pointer',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        larguraTotal && 'w-full',
        className,
      )}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? <Spinner tamanho={18} /> : iconeEsquerda}
      {children}
    </button>
  )
}
