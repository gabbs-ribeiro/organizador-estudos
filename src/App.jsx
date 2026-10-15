import { useEffect, useState } from 'react'
import { supabase, configured } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Week from './pages/Week'
import Notebook from './pages/Notebook'

const TABS = [['hoje', 'Hoje', Dashboard], ['semana', 'Semana', Week], ['caderno', 'Caderno', Notebook]]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('hoje')
  useEffect(() => {
    if (!configured) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!configured) return <main className="center"><div className="card"><h2>Configuração pendente</h2><p>Crie o arquivo <code>.env</code> a partir do <code>.env.example</code> com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reinicie o <code>npm run dev</code>.</p></div></main>
  if (session === undefined) return <main className="center"><p>Carregando…</p></main>
  if (!session) return <Auth />
  const Page = TABS.find((t) => t[0] === tab)[2]
  return (
    <div className="shell">
      <nav className="nav" aria-label="Principal">
        <strong className="brand">Estudos</strong>
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        <button className="out" onClick={() => supabase.auth.signOut()}>Sair</button>
      </nav>
      <main className="page"><Page goto={setTab} /></main>
    </div>
  )
}
