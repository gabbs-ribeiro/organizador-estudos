import { useCallback, useEffect, useState } from 'react'
import { tasks } from '../services/api'
import { today, iso, weekStart, addDays, DIA_FULL, fmtMin } from '../lib/util'
import TaskItem from '../components/TaskItem'
import Goals from '../components/Goals'
import { Greeting, InfoChips } from '../components/HeroInfo'

export default function Dashboard({ goto }) {
  const [week, setWeek] = useState([]), [err, setErr] = useState(''), [loading, setLoading] = useState(true)
  const [goalSummary, setGoalSummary] = useState({ count: null, practiceMinutes: 0 })
  const reportGoals = useCallback((count, practiceMinutes) => setGoalSummary({ count, practiceMinutes }), [])
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
  // adiadas vão para Pendentes; não realizadas saem das listas (continuam só no mural, como histórico)
  const todayT = week.filter((t) => t.task_date === t0 && !['adiada', 'nao_realizada'].includes(t.status))
  const done = todayT.filter((t) => t.status === 'concluida').length
  const plannedToday = todayT.reduce((a, t) => a + t.est_minutes, 0)
  const todayTasks = week.filter((t) => t.task_date === t0 && t.status !== 'nao_realizada')
  const theoryMinutes = todayTasks.reduce((sum, t) => sum + (t.actual_minutes || 0), 0)
  const totalMinutes = theoryMinutes + goalSummary.practiceMinutes
  const targetMinutes = plannedToday + (goalSummary.count || 0) * 30
  const late = week.filter((t) => t.status === 'adiada' || (t.task_date < t0 && ['pendente', 'em_andamento', 'pausada'].includes(t.status)))
  return (
    <>
      {err && <p role="alert" className="err">{err}</p>}
      <section className="today hero" aria-label="Atividades de hoje">
        <div className="hero-top"><Greeting /><InfoChips /></div>
        <div className="hero-sub">
          <p>Hoje é {DIA_FULL[d.getDay()]}, essas são suas tarefas:</p>
          <span>{todayT.length ? `${done} de ${todayT.length} concluídas · ${fmtMin(plannedToday)} planejadas` : 'Nenhuma atividade planejada'}</span>
        </div>
        <div className="bar" aria-hidden="true"><i style={{ width: todayT.length ? `${(done / todayT.length) * 100}%` : '0%' }} /></div>
        {todayT.length === 0 ? <p className="empty">Adicione uma tarefa em Semana (Gerenciar) ou ajuste a rotina padrão.</p>
          : <ul className="list">{todayT.map((t) => <TaskItem big key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>}
      </section>
      <Goals onError={setErr} onSummary={reportGoals} />
      {late.length > 0 && <section>
        <h2>Pendentes</h2>
        <p className="muted small">Adiadas e de dias anteriores. Inicie, remarque ou marque como não realizada (sai da lista).</p>
        <ul className="list">{late.map((t) => <TaskItem key={t.id} t={t} onChange={load} onError={setErr} />)}</ul>
      </section>}
      <div className="row"><button className="ghost" onClick={() => goto('semana')}>Ver mural da semana</button><button className="primary" onClick={() => goto('exercicios')}>Registrar exercício</button></div>
      <section className="card home-study-panel" aria-label="Resumo das horas de estudo de hoje">
        <div className="home-study-head"><h2>Estudos de hoje</h2><span className="muted small">Tempo realizado e meta diária</span></div>
        <div className="home-study-grid">
          <article className="study-stat study-total"><span className="muted small">Tempo total</span><strong>{fmtMin(totalMinutes)}</strong><span className="muted small">Teórico + prática</span></article>
          <article className="study-stat"><span className="muted small">Estudo teórico</span><strong>{fmtMin(theoryMinutes)}</strong><span className="muted small">Tarefas realizadas</span></article>
          <article className="study-stat study-practice"><span className="muted small">Prática</span><strong>{fmtMin(goalSummary.practiceMinutes)}</strong><span className="muted small">Metas concluídas</span></article>
          <article className="study-stat study-target"><span className="muted small">Meta de hoje</span><strong>{goalSummary.count === null ? '—' : fmtMin(targetMinutes)}</strong><span className="muted small">{goalSummary.count ?? '…'} metas × 30 min + {fmtMin(plannedToday)} previstos</span></article>
        </div>
      </section>
    </>
  )
}
