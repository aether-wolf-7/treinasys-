const BASE = 'http://localhost:3333'
let passou = 0
let falhou = 0

async function chamar(metodo, rota, { body, token, headers = {} } = {}) {
  const res = await fetch(BASE + rota, {
    method: metodo,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const texto = await res.text()
  let json = null
  try {
    json = texto ? JSON.parse(texto) : null
  } catch {
    /* resposta sem corpo */
  }
  return { status: res.status, json }
}

function checar(nome, condicao, detalhe = '') {
  if (condicao) {
    passou++
    console.log(`  ok    ${nome}`)
  } else {
    falhou++
    console.log(`  FALHA ${nome} ${detalhe}`)
  }
}

const senha = 'Treinasys@2026'

console.log('\n--- login e identidade ---')

const login = await chamar('POST', '/api/v1/auth/login', {
  body: { identificador: 'admin@rpz.com.br', senha },
})
checar('login por e-mail retorna 200', login.status === 200, `status=${login.status}`)
checar('veio accessToken', Boolean(login.json?.data?.accessToken))
checar('veio refreshToken', Boolean(login.json?.data?.refreshToken))
checar('envelope { success, data, error }', login.json?.success === true && login.json?.error === null)

const token = login.json?.data?.accessToken
const refreshToken = login.json?.data?.refreshToken

const me = await chamar('GET', '/api/v1/auth/me', { token })
checar('GET /me retorna 200', me.status === 200, `status=${me.status}`)
checar('perfil correto (ADMIN)', me.json?.data?.role === 'ADMIN', `role=${me.json?.data?.role}`)
checar('empresa vinculada', me.json?.data?.tenant?.slug === 'rpz-transportes')

const porCpf = await chamar('POST', '/api/v1/auth/login', {
  body: { identificador: '12345678901', senha },
})
checar('motorista entra por CPF', porCpf.status === 200, `status=${porCpf.status}`)
checar('CPF traz o COLABORADOR', porCpf.json?.data?.usuario?.role === 'COLABORADOR')

console.log('\n--- credenciais invalidas ---')

const senhaErrada = await chamar('POST', '/api/v1/auth/login', {
  body: { identificador: 'admin@rpz.com.br', senha: 'ErradaTotalmente@1' },
})
checar('senha errada retorna 401', senhaErrada.status === 401, `status=${senhaErrada.status}`)
checar('codigo CREDENCIAIS_INVALIDAS', senhaErrada.json?.error?.code === 'CREDENCIAIS_INVALIDAS')

const inexistente = await chamar('POST', '/api/v1/auth/login', {
  body: { identificador: 'nao-existe@rpz.com.br', senha },
})
checar('usuario inexistente retorna 401', inexistente.status === 401)
checar(
  'mesma resposta para inexistente e senha errada (sem enumeracao)',
  inexistente.json?.error?.code === senhaErrada.json?.error?.code,
)

console.log('\n--- protecao das rotas ---')

const semToken = await chamar('GET', '/api/v1/auth/me')
checar('sem token retorna 401', semToken.status === 401, `status=${semToken.status}`)
checar('codigo TOKEN_AUSENTE', semToken.json?.error?.code === 'TOKEN_AUSENTE')

const tokenLixo = await chamar('GET', '/api/v1/auth/me', { token: 'abc.def.ghi' })
checar('token invalido retorna 401', tokenLixo.status === 401)
checar('codigo TOKEN_INVALIDO', tokenLixo.json?.error?.code === 'TOKEN_INVALIDO')

console.log('\n--- validacao ---')

const semCorpo = await chamar('POST', '/api/v1/auth/login', { body: {} })
checar('body vazio retorna 400', semCorpo.status === 400, `status=${semCorpo.status}`)
checar('codigo VALIDACAO', semCorpo.json?.error?.code === 'VALIDACAO')
checar('detalha o campo faltando', Boolean(semCorpo.json?.error?.details?.identificador))

console.log('\n--- rotacao de refresh token ---')

const renovado = await chamar('POST', '/api/v1/auth/refresh', { body: { refreshToken } })
checar('refresh retorna 200', renovado.status === 200, `status=${renovado.status}`)
checar('veio token novo', renovado.json?.data?.accessToken !== token)

const refreshReusado = await chamar('POST', '/api/v1/auth/refresh', { body: { refreshToken } })
checar('refresh antigo nao vale mais (rotacao)', refreshReusado.status === 401, `status=${refreshReusado.status}`)

console.log('\n--- logout revoga a sessao de verdade ---')

const tokenVivo = renovado.json?.data?.accessToken
const antesDoLogout = await chamar('GET', '/api/v1/auth/me', { token: tokenVivo })
checar('token vale antes do logout', antesDoLogout.status === 200)

const saida = await chamar('POST', '/api/v1/auth/logout', { token: tokenVivo, body: {} })
checar('logout retorna 204', saida.status === 204, `status=${saida.status}`)

const depoisDoLogout = await chamar('GET', '/api/v1/auth/me', { token: tokenVivo })
checar('token nao vale depois do logout', depoisDoLogout.status === 401, `status=${depoisDoLogout.status}`)
checar('codigo TOKEN_REVOGADO', depoisDoLogout.json?.error?.code === 'TOKEN_REVOGADO')

console.log('\n--- recuperacao de senha nao vaza cadastro ---')

const existe = await chamar('POST', '/api/v1/auth/forgot-password', {
  body: { email: 'admin@rpz.com.br' },
})
const naoExiste = await chamar('POST', '/api/v1/auth/forgot-password', {
  body: { email: 'ninguem@rpz.com.br' },
})
checar('mesma resposta existindo ou nao a conta', existe.status === naoExiste.status && existe.status === 204)

console.log(`\n=====  ${passou} passaram, ${falhou} falharam  =====\n`)
process.exit(falhou > 0 ? 1 : 0)
