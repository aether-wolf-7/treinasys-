import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NaoEncontrada() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-5xl font-bold text-faint">404</p>
        <h1 className="mt-3 text-xl font-semibold">Pagina nao encontrada</h1>
        <p className="mt-1 text-muted">O endereco que voce abriu nao existe.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variante="secundario">Voltar ao inicio</Button>
        </Link>
      </div>
    </div>
  )
}
