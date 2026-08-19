import { Logo } from './Logo'
import { Spinner } from './ui/Spinner'

export function TelaCarregando() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Logo tamanho={44} />
        <Spinner tamanho={22} className="text-muted" />
      </div>
    </div>
  )
}
