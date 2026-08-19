interface Props {
  tamanho?: number
  className?: string
}

/**
 * Marca do TreinaSys: estrada + circuito, conforme o Plano Mestre.
 * Desenhado em SVG para sair nitido em qualquer tamanho, inclusive impresso
 * no certificado. Sera trocado pelo vetor oficial quando o cliente enviar.
 */
export function Logo({ tamanho = 32, className }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label="TreinaSys"
    >
      <rect width="40" height="40" rx="10" fill="url(#treinasys-fundo)" />
      {/* estrada em perspectiva */}
      <path d="M13 31 L18 12 h4 l5 19" stroke="#f1f5f9" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 15 v3 M20 21 v3 M20 27 v3" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      {/* trilhas de circuito */}
      <path d="M8 20 h4 M28 20 h4" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="20" r="1.75" fill="#60a5fa" />
      <circle cx="33" cy="20" r="1.75" fill="#60a5fa" />
      <defs>
        <linearGradient id="treinasys-fundo" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  )
}
