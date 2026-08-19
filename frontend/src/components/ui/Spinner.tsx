interface Props {
  tamanho?: number
  className?: string
}

export function Spinner({ tamanho = 20, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="status"
      aria-label="Carregando"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="origin-center animate-spin"
      />
    </svg>
  )
}
