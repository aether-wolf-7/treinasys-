import { Card } from '../components/ui/Card'

interface Props {
  titulo: string
  descricao: string
  itens: string[]
  semana: string
}

/**
 * Tela de modulo ainda nao construido.
 *
 * Existe para o menu nunca levar a lugar nenhum. Em vez de erro ou pagina em
 * branco, mostra o que vem naquele modulo e em qual etapa entra. O cliente
 * acompanha o avanco sem precisar perguntar.
 */
export function EmBreve({ titulo, descricao, itens, semana }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="mt-1 text-muted">{descricao}</p>
      </header>

      <Card>
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="grid size-6 place-items-center rounded-full bg-primary/12">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          Previsto para {semana}
        </div>

        <p className="mb-3 text-sm text-muted">O que este modulo vai trazer:</p>
        <ul className="space-y-2">
          {itens.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-faint" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
