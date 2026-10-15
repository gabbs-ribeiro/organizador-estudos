import { useCallback, useEffect, useState } from 'react'
import { tasks, routines } from '../services/api'
import { iso, weekStart, addDays, DIAS, CATS } from '../lib/util'
import TaskItem from '../components/TaskItem'

export default function Week() {
  const [off, setOff] = useState(0), [list, setList] = useState([]), [rt, setRt] = useState([]), [err, setErr] = useState(''), [msg, setMsg] = useState('')
  const start = addDays(weekStart(), off * 7)
  const load = useCallback(async () => {
    try { setList(await tasks.range(iso(start), iso(addDays(start, 6)))); setRt(await routines.list()); setErr('') } catch (e) { setErr(e.message) }
  }, [off]) // eslint-disable-line
  useEffect(() => { load() }, [load])
  async function generate() {
    try { await tasks.generateWeek(start, iso); setMsg('Semana gerada pela rotina (sem duplicar o que já existe).'); load() } catch (e) { setErr(e.message) }
  }
  async function add(e) {
    e.preventDefault(); const f = new FormData(e.target)
    if (!f.get('title').trim()) return setErr('Informe um título.')
    try { await tasks.add({ title: f.get('title').trim(), task_date: f.get('date'), category: f.get('category'), est_minutes: +f.get('min') || 0, description: f.get('desc') || null }); e.target.reset(); setMsg('Tarefa adicionada.'); load() } catch (x) { setErr(x.message) }
  }
  async function editRt(r) {
    const title = window.prompt('Título:', r.title); if (title === null || !title.trim()) return
    const m = window.prompt('Minutos planejados:', String(r.minutes)); if (m === null) return
    try { await routines.update(r.id, { title: title.trim(), minutes: Math.max(0, parseInt(m, 10) || 0) }); load() } catch (x) { setErr(x.message) }
  }
  async function delRt(r) { if (window.confirm(`Remover "${r.title}" da rotina? Tarefas já geradas continuam.`)) try { await routines.remove(r.id); load() } catch (x) { setErr(x.message) } }
  async function addRt(e) {
    e.preventDefault(); const f = new FormData(e.target)
    try { await routines.add({ weekday: +f.get('wd'), title: f.get('title').trim(), category: f.get('category'), minutes: +f.get('min') || 0 }); e.target.reset(); load() } catch (x) { setErr(x.message) }
  }
  const catOpts = Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)
  return (
    <>
      <div className="row between wrap"><h1>Semana</h1>
        <div className="row"><button className="ghost" onClick={() => setOff(off - 1)}>Anterior</button><button className="ghost" onClick={() => setOff(0)}>Atual</button><button className="ghost" onClick={() => setOff(off + 1)}>Próxima</button></div></div>
      <p className="muted">{start.toLocaleDateString('pt-BR')} a {addDays(start, 6).toLocaleDateString('pt-BR')}</p>
      {err && <p role="alert" className="err">{err}</p>}{msg && <p role="status" className="ok">{msg}</p>}
      <button className="primary" onClick={generate}>Gerar semana pela rotina</button>
      {DIAS.map((n, i) => { const date = iso(addDays(start, i)), day = list.filter((t) => t.task_date === date)
        return <section key={i}><h2>{n} <span className="muted small">{date.split('-').reverse().slice(0, 2).join('/')}</span></h2>
          {day.length ? <ul className="list">{day.map((t) => <TaskItem key={t.id} t={t} onChange={load} onError={setErr} />)}</ul> : <p className="empty">Sem atividades.</p>}</section> })}
      <section><h2>Nova tarefa</h2>
        <form className="form" onSubmit={add}><input name="title" placeholder="Título" required /><input name="date" type="date" defaultValue={iso(start)} required />
          <select name="category">{catOpts}</select><input name="min" type="number" min="0" placeholder="Minutos" defaultValue="30" /><input name="desc" placeholder="Descrição (opcional)" /><button className="primary">Adicionar tarefa</button></form></section>
      <section><h2>Rotina padrão</h2><p className="muted small">Modelo usado para gerar semanas. Alterar aqui não muda tarefas já geradas.</p>
        <ul className="list">{rt.map((r) => <li key={r.id} className="task"><div><b>{DIAS[r.weekday]}: {r.title}</b><span className="muted"> {r.minutes} min</span>{r.description && <p className="muted small">{r.description}</p>}</div>
          <div className="row"><button className="ghost" onClick={() => editRt(r)}>Editar</button><button className="ghost" onClick={() => delRt(r)}>Remover</button></div></li>)}</ul>
        <form className="form" onSubmit={addRt}><select name="wd">{DIAS.map((n, i) => <option key={i} value={i}>{n}</option>)}</select><input name="title" placeholder="Atividade" required /><select name="category">{catOpts}</select><input name="min" type="number" min="0" defaultValue="60" /><button className="primary">Adicionar à rotina</button></form></section>
    </>
  )
}
