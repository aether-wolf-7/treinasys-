import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, definirSessao, limparSessao, temRefreshGuardado } from '../lib/api'
import type { PerfilCompleto, RespostaLogin } from '../lib/tipos'

interface Contexto {
  usuario: PerfilCompleto | null
  carregando: boolean
  entrar: (identificador: string, senha: string) => Promise<void>
  sair: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const AuthContext = createContext<Contexto | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<PerfilCompleto | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregarPerfil = useCallback(async () => {
    const perfil = await api.get<PerfilCompleto>('/auth/me')
    setUsuario(perfil)
  }, [])

  /**
   * Na abertura da aplicacao, se existe refresh token guardado, reconstroi a
   * sessao sem pedir senha. E o que permite o motorista fechar o navegador no
   * meio do treinamento e voltar de onde parou.
   */
  useEffect(() => {
    let ativo = true

    async function restaurar() {
      if (!temRefreshGuardado()) {
        if (ativo) setCarregando(false)
        return
      }

      const renovou = await api.renovarSessao()
      if (!ativo) return

      if (renovou) {
        try {
          await carregarPerfil()
        } catch {
          limparSessao()
        }
      }

      if (ativo) setCarregando(false)
    }

    void restaurar()
    return () => {
      ativo = false
    }
  }, [carregarPerfil])

  const entrar = useCallback(
    async (identificador: string, senha: string) => {
      const resposta = await api.post<RespostaLogin>('/auth/login', { identificador, senha })
      definirSessao(resposta)
      await carregarPerfil()
    },
    [carregarPerfil],
  )

  const sair = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Mesmo se a chamada falhar, a sessao local tem que ser descartada.
    }
    limparSessao()
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, sair, recarregarPerfil: carregarPerfil }),
    [usuario, carregando, entrar, sair, carregarPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): Contexto {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  }
  return ctx
}
