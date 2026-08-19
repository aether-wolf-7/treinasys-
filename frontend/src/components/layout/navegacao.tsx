import type { ReactNode } from 'react'
import type { Perfil } from '../../lib/tipos'
import { NIVEL } from '../../lib/tipos'

/**
 * Icones em SVG, nao emoji.
 *
 * O painel atual do cliente usa emoji no menu. Funciona, mas cada sistema
 * operacional desenha de um jeito e no Android alguns saem coloridos demais,
 * destoando do tema escuro. Em SVG o icone herda a cor do texto e fica igual
 * em todo aparelho.
 */
const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" {...traco}>
      {children}
    </svg>
  )
}

export const Icone = {
  painel: (
    <Svg>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Svg>
  ),
  alertas: (
    <Svg>
      <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  ),
  historico: (
    <Svg>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </Svg>
  ),
  reacao: (
    <Svg>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" />
    </Svg>
  ),
  tempos: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Svg>
  ),
  presenciais: (
    <Svg>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  ),
  gestores: (
    <Svg>
      <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5.1-7.5-9.5V6z" />
      <path d="M9.5 12l1.8 1.8 3.5-3.6" />
    </Svg>
  ),
  usuarios: (
    <Svg>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.2a3.5 3.5 0 0 1 0 5.6M18 20a6.4 6.4 0 0 0-1.6-4.3" />
    </Svg>
  ),
  empresas: (
    <Svg>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
    </Svg>
  ),
  treinamentos: (
    <Svg>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </Svg>
  ),
  certificados: (
    <Svg>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5L7 21l5-2.2L17 21l-1.5-7.5" />
    </Svg>
  ),
}

export interface ItemMenu {
  rotulo: string
  para: string
  icone: ReactNode
  /** Perfil minimo que enxerga o item. */
  minimo: Perfil
}

/**
 * Estrutura de menu do painel que o cliente ja usa, mantida na mesma ordem:
 * Painel, Alertas, Historico, Avaliacao de Reacao, Tempos, Presenciais,
 * Gestores, Usuarios. Empresas e exclusivo do Master.
 */
export const MENU_GESTAO: ItemMenu[] = [
  { rotulo: 'Painel', para: '/', icone: Icone.painel, minimo: 'GESTOR' },
  { rotulo: 'Alertas', para: '/alertas', icone: Icone.alertas, minimo: 'GESTOR' },
  { rotulo: 'Historico', para: '/historico', icone: Icone.historico, minimo: 'GESTOR' },
  { rotulo: 'Avaliacao de Reacao', para: '/reacao', icone: Icone.reacao, minimo: 'GESTOR' },
  { rotulo: 'Tempos', para: '/tempos', icone: Icone.tempos, minimo: 'GESTOR' },
  { rotulo: 'Presenciais', para: '/presenciais', icone: Icone.presenciais, minimo: 'INSTRUTOR' },
  { rotulo: 'Usuarios', para: '/usuarios', icone: Icone.usuarios, minimo: 'ADMIN' },
  { rotulo: 'Gestores', para: '/gestores', icone: Icone.gestores, minimo: 'ADMIN' },
  { rotulo: 'Empresas', para: '/empresas', icone: Icone.empresas, minimo: 'MASTER' },
]

/** Menu do colaborador: so o que ele precisa, sem nada de gestao. */
export const MENU_COLABORADOR: ItemMenu[] = [
  { rotulo: 'Meus treinamentos', para: '/', icone: Icone.treinamentos, minimo: 'COLABORADOR' },
  { rotulo: 'Meus certificados', para: '/certificados', icone: Icone.certificados, minimo: 'COLABORADOR' },
]

export function menuDoPerfil(perfil: Perfil): ItemMenu[] {
  if (perfil === 'COLABORADOR') return MENU_COLABORADOR
  return MENU_GESTAO.filter((item) => NIVEL[perfil] >= NIVEL[item.minimo])
}
