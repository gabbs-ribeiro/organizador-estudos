import { useCallback, useEffect, useState } from 'react'
import { tasks, exercises } from '../services/api'
import { today, iso, weekStart, addDays, DIAS, fmtMin } from '../lib/util'
import TaskItem from '../components/TaskItem'

export default function Dashboard({ goto }) {
  const [week, setWeek] = useState([]), [ex, setEx] = useState([]), [err, setErr] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const s = weekStart()
      const [w, e] = await Promise.all([tasks.range(iso(addDays(s, -14)), iso(addDays(s, 6))), exercises.list()])
      setWeek(w); setEx(e); setErr('')
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  if (loading) return <p>Carregando…</p>
  const d = new Date(), t0 = today(), ws = iso(weekStart())
  const thisWeek = week.filter((t) => t.task_date >= ws)
  const todayT = week.filter((t) => t.task_date === t0)
  const done = todayT.filter((t) => t.status === 'concluida').length
  const plannedToday = todayT.reduce((a, t) => a + t.est_minutes, 0)
  const late = week.filter((t) => t.task_date < t0 && ['pendente', 'em_andamento', 'adiada'].includes(t.status))
  const planned = thisWeek.reduce((a, t) => a + t.est_minutes, 0)
  const real = thisWeek.filter((t) => t.status === 'concluida' && t.actual_minutes != null).reduce((a, t) => a + t.actual_minutes, 0)
  const c = (s) => ex.filter((x) => x.status === s).length
  return (
    <>
      <h1>Olá!</h1>
      <p className="muted">{DIAS[d.getDay()]}, {d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      {err && <p role="alert" className="err">{err}</p>}
      <div className="grid">
        <div className="card"><span className="muted">Hoje</span><big>{done}/{todayT.length}</big><span className="muted small">concluídas · {fmtMin(plannedToday)} planejadas</span></div>
        <div className="card"><span className="muted">Semana</span><big>{fmtMin(real)}</big><span className="muted small">com tempo informado, de {fmtMin(planned)} planejadas</span></div>
        <div className="card"><span className="muted">Exercícios</span><big>{ex.length}</big><span className="muted small">{c('sozinho')} sozinho · {c('com_ajuda')} com ajuda · {c('revisar')} a revisar</span></div>
      </div>
      <section>
        <div className="row between"><h2>Atividades de hoje</h2><button className="ghost" onClick={() => goto('semana')}>Ver semana</button></div>
        {todayT.length === 0 ? <p className="empty">Nada planejado para hoje. Gere a semana pela rotina ou adicione uma tarefa em Semana.</p>
          : <ul className="list">{todayT.map((t) => <TaskItem key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>}
      </section>
      {late.length > 0 && <section>
        <h2>Pendentes e adiadas</h2>
        <p className="muted small">Sem pressão: remarque para outro dia ou marque como não realizada.</p>
        <ul className="list">{late.map((t) => <TaskItem key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>
      </section>}
      <div className="row"><button className="primary" onClick={() => goto('caderno')}>Registrar exercício</button></div>
    </>
  )
}
