import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/index.css'
import { App } from './App'

const raiz = document.getElementById('root')
if (!raiz) {
  throw new Error('Elemento #root nao encontrado no index.html')
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
