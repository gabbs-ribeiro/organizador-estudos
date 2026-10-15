import { useState } from 'react'
import { supabase } from '../lib/supabase'
export default function Auth() {
  const [mode, setMode] = useState('login'), [email, setEmail] = useState(''), [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setMsg('')
    if (pw.length < 6) return setMsg('A senha precisa ter ao menos 6 caracteres.')
    setBusy(true)
    const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { data, error } = await fn.call(supabase.auth, { email, password: pw })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'signup' && !data.session) setMsg('Conta criada. Confirme o e-mail que enviamos e depois entre.')
  }
  return (
    <main className="center">
      <form className="card auth" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
        <label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>Senha<input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {msg && <p role="alert" className="err">{msg}</p>}
        <button className="primary" disabled={busy}>{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Não tenho conta' : 'Já tenho conta'}</button>
      </form>
    </main>
  )
}
