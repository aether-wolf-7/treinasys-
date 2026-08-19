import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string
  erro?: string
  dica?: string
  acaoDireita?: ReactNode
}

export function Input({ rotulo, erro, dica, acaoDireita, className, id, ...resto }: Props) {
  const gerado = useId()
  const idCampo = id ?? gerado
  const idErro = idCampo + '-erro'
  const idDica = idCampo + '-dica'

  return (
    <div>
      <label htmlFor={idCampo} className="mb-1.5 block text-sm font-medium text-ink">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={idCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : dica ? idDica : undefined}
          className={cn(
            'min-h-tap w-full rounded-xl border bg-canvas/60 px-3.5 text-base text-ink',
            'placeholder:text-faint transition-colors',
            'focus:border-primary focus:outline-none',
            erro ? 'border-danger/60' : 'border-white/8 hover:border-white/16',
            acaoDireita ? 'pr-12' : null,
            className,
          )}
          {...resto}
        />
        {acaoDireita && (
          <div className="absolute inset-y-0 right-1 flex items-center">{acaoDireita}</div>
        )}
      </div>
      {erro ? (
        <p id={idErro} className="mt-1.5 text-sm text-danger">
          {erro}
        </p>
      ) : dica ? (
        <p id={idDica} className="mt-1.5 text-sm text-muted">
          {dica}
        </p>
      ) : null}
    </div>
  )
}
