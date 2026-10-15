import { useCallback, useEffect, useState } from 'react'
import { tasks } from '../services/api'
import { today, iso, weekStart, addDays, DIAS, fmtMin } from '../lib/util'
import TaskItem from '../components/TaskItem'
import Goals from '../components/Goals'

export default function Dashboard({ goto }) {
  const [week, setWeek] = useState([]), [err, setErr] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const s = weekStart()
      const r = () => tasks.range(iso(addDays(s, -14)), iso(addDays(s, 6)))
      let w = await r()
      // ao abrir, se hoje não tem nada, gera as tarefas do dia pela rotina (sem duplicar)
      if (!w.some((t) => t.task_date === today())) { await tasks.generateDays(s, iso, today()); w = await r() }
      setWeek(w); setErr('')
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  if (loading) return <p>Carregando…</p>
  const d = new Date(), t0 = today()
  const todayT = week.filter((t) => t.task_date === t0)
  const done = todayT.filter((t) => t.status === 'concluida').length
  const plannedToday = todayT.reduce((a, t) => a + t.est_minutes, 0)
  const late = week.filter((t) => t.task_date < t0 && ['pendente', 'em_andamento', 'pausada', 'adiada'].includes(t.status))
  return (
    <>
      {err && <p role="alert" className="err">{err}</p>}
      <section className="today" aria-label="Atividades de hoje">
        <h2>Hoje · {DIAS[d.getDay()]}, {d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h2>
        <p className="sub">{todayT.length ? `${done} de ${todayT.length} concluídas · ${fmtMin(plannedToday)} planejadas` : 'Nenhuma atividade planejada.'}</p>
        <div className="bar" aria-hidden="true"><i style={{ width: todayT.length ? `${(done / todayT.length) * 100}%` : '0%' }} /></div>
        {todayT.length === 0 ? <p className="empty">Adicione uma tarefa em Semana (Gerenciar) ou ajuste a rotina padrão.</p>
          : <ul className="list">{todayT.map((t) => <TaskItem big key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>}
      </section>
      <Goals onError={setErr} />
      {late.length > 0 && <section>
        <h2>Pendentes e adiadas</h2>
        <p className="muted small">Sem pressão: remarque para outro dia ou marque como não realizada.</p>
        <ul className="list">{late.map((t) => <TaskItem key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>
      </section>}
      <div className="row"><button className="ghost" onClick={() => goto('semana')}>Ver mural da semana</button><button className="primary" onClick={() => goto('caderno')}>Registrar exercício</button></div>
    </>
  )
}
