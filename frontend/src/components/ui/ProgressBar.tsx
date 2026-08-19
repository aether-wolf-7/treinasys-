interface Props {
  valor: number
  rotulo?: string
  className?: string
}

export function ProgressBar({ valor, rotulo, className }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)))

  return (
    <div className={className}>
      {rotulo && (
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{rotulo}</span>
          <span className="font-semibold text-ink">{pct}%</span>
        </div>
      )}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/8"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  )
}
