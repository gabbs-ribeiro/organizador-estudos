import { useCallback, useEffect, useState } from 'react'
import { tasks, routines, goals } from '../services/api'
import { iso, today, weekStart, addDays, DIAS, TASK_CATS, STATUS, fmtMin, fmtDur } from '../lib/util'

// Item do mural: título da anotação em destaque; clicar abre a anotação expandida na tela.
function Entry({ title, sub, done, onOpen }) {
  return <button className={`entry${done ? ' done' : ''}`} onClick={onOpen}><span className="et">{title}</span><span className="muted small">{sub}</span></button>
}

// Leitor: anotação em tela cheia (celular) / folha grande (PC) para estudar o conteúdo.
function Viewer({ v, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose}>
      <article className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><span className="pill">{v.kind} · {v.date}</span><button className="ghost" onClick={onClose}>Fechar</button></div>
        <h2>{v.title}</h2>
        {v.sub && <p className="muted">{v.sub}</p>}
        <div className="body">{v.body || <span className="muted">Sem descrição registrada.</span>}</div>
        {v.meta && <p className="muted small">{v.meta}</p>}
      </article>
    </div>
  )
}

const metaOf = (t) => [TASK_CATS[t.category] || t.category, `${fmtMin(t.est_minutes)} previstos`,
  t.work_seconds > 0 ? `Em atividade ${fmtDur(t.work_seconds)}` : t.actual_minutes != null ? `${fmtMin(t.actual_minutes)} reais` : null,
  t.paused_seconds > 0 ? `Pausado ${fmtDur(t.paused_seconds)}` : null].filter(Boolean).join(' · ')

export default function Week() {
  const [off, setOff] = useState(0), [list, setList] = useState([]), [logs, setLogs] = useState([])
  const [rt, setRt] = useState([]), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [view, setView] = useState(null)
  const start = addDays(weekStart(), off * 7)
  const catOpts = Object.entries(TASK_CATS).map(([key, label]) => <option key={key} value={key}>{label}</option>)

  const load = useCallback(async () => {
    const s = addDays(weekStart(), off * 7), from = iso(s), to = iso(addDays(s, 6))
    try {
      const [ts, ls, rs] = await Promise.all([tasks.range(from, to), goals.logs(from, to), routines.list()])
      setList(ts); setLogs(ls); setRt(rs); setErr('')
    } catch (e) { setErr(e.message) }
  }, [off])
  useEffect(() => { load() }, [load])

  async function generate() {
    try { await tasks.generateWeek(start, iso); setMsg('Tarefas geradas pela rotina.'); await load() } catch (e) { setErr(e.message) }
  }
  async function add(e) {
    e.preventDefault()
    const element = e.currentTarget, form = new FormData(element), title = String(form.get('title') || '').trim()
    if (!title) return setErr('Informe um título.')
    try {
      await tasks.add({
        title, task_date: form.get('date'), category: form.get('category'),
        est_minutes: Number(form.get('min') || 0), description: String(form.get('desc') || '').trim() || null,
      })
      element.reset()
      setMsg('Tarefa adicionada.'); await load()
    } catch (x) { setErr(x.message) }
  }
  async function addRt(e) {
    e.preventDefault()
    const element = e.currentTarget, form = new FormData(element), title = String(form.get('title') || '').trim()
    if (!title) return setErr('Informe um título para a rotina.')
    try {
      await routines.add({
        weekday: Number(form.get('wd')), title, category: form.get('category'),
        minutes: Number(form.get('min') || 0),
      })
      element.reset()
      setMsg('Atividade adicionada à rotina.'); await load()
    } catch (x) { setErr(x.message) }
  }
  async function editRt(r) {
    const title = window.prompt('Nome da atividade:', r.title)
    if (title === null) return
    const minutes = window.prompt('Duração em minutos:', String(r.minutes))
    if (minutes === null) return
    const cleanTitle = title.trim(), cleanMinutes = Number(minutes)
    if (!cleanTitle || !Number.isInteger(cleanMinutes) || cleanMinutes < 0) {
      setErr('Informe um título e uma duração válida (número inteiro maior ou igual a zero).')
      return
    }
    try {
      await routines.update(r.id, { title: cleanTitle, minutes: cleanMinutes })
      setMsg('Rotina atualizada.'); await load()
    } catch (e) { setErr(e.message) }
  }
  async function delRt(r) {
    if (!window.confirm(`Remover "${r.title}" da rotina padrão?`)) return
    try { await routines.remove(r.id); setMsg('Atividade removida da rotina.'); await load() } catch (e) { setErr(e.message) }
  }

  return (
    <>
      <div className="row between wrap"><h1>Mural da semana</h1>
        <div className="row"><button className="ghost" onClick={() => setOff(off - 1)}>Anterior</button><button className="ghost" onClick={() => setOff(0)}>Atual</button><button className="ghost" onClick={() => setOff(off + 1)}>Próxima</button></div></div>
      <p className="muted">{start.toLocaleDateString('pt-BR')} a {addDays(start, 6).toLocaleDateString('pt-BR')}</p>
      {err && <p role="alert" className="err">{err}</p>}{msg && <p role="status" className="ok">{msg}</p>}
      <div className="mural">
        {DIAS.map((n, i) => {
          const date = iso(addDays(start, i)), dt = list.filter((t) => t.task_date === date), dl = logs.filter((l) => l.log_date === date)
          const nDone = dt.filter((t) => t.status === 'concluida').length, label = `${n}, ${date.split('-').reverse().join('/')}`
          return (
            <section key={i} className={`day${date === today() ? ' now' : ''}`}>
              <h2>{n} <span className="muted small">{date.split('-').reverse().slice(0, 2).join('/')}</span></h2>
              <div className="blk">
                <h3>Tarefas <span className="pill">{nDone}/{dt.length}</span></h3>
                {dt.length === 0 ? <p className="empty">Sem tarefas neste dia.</p> : dt.map((t) =>
                  <Entry key={t.id} done={t.status === 'concluida'} title={t.note_title || t.title} sub={`${t.note_title ? t.title + ' · ' : ''}${STATUS[t.status]}`}
                    onOpen={() => setView({ kind: 'Tarefa', date: label, title: t.note_title || t.title, sub: `${t.title} · ${STATUS[t.status]}`, body: t.note_body, meta: metaOf(t) })} />)}
              </div>
              <div className="blk goalblk">
                <h3>Realizações <span className="pill on">{dl.length}</span></h3>
                {dl.length === 0 ? <p className="empty">Nenhuma realização neste dia.</p> : dl.map((l) =>
                  <Entry key={l.id} done title={l.note_title || l.study_goals?.title || 'Meta'} sub={l.note_title ? l.study_goals?.title : 'Sem título de anotação'}
                    onOpen={() => setView({ kind: 'Realização', date: label, title: l.note_title || l.study_goals?.title || 'Meta', sub: l.study_goals?.title, body: l.note_body })} />)}
              </div>
            </section>)
        })}
      </div>
      {view && <Viewer v={view} onClose={() => setView(null)} />}
      <details className="manage"><summary>Gerenciar tarefas e rotina padrão</summary>
        <button className="primary" onClick={generate}>Gerar esta semana pela rotina</button>
        <h2>Nova tarefa</h2>
        <form className="form" onSubmit={add}><input name="title" placeholder="Título" required /><input name="date" type="date" defaultValue={iso(start)} required />
          <select name="category">{catOpts}</select><input name="min" type="number" min="0" placeholder="Minutos" defaultValue="30" /><input name="desc" placeholder="Descrição (opcional)" /><button className="primary">Adicionar tarefa</button></form>
        <h2>Rotina padrão</h2><p className="muted small">Modelo usado para gerar semanas. Alterar aqui não muda tarefas já geradas.</p>
        <ul className="list">{rt.map((r) => <li key={r.id} className="task"><div><b>{DIAS[r.weekday]}: {r.title}</b><span className="muted"> {r.minutes} min</span>{r.description && <p className="muted small">{r.description}</p>}</div>
          <div className="row"><button className="ghost" onClick={() => editRt(r)}>Editar</button><button className="ghost" onClick={() => delRt(r)}>Remover</button></div></li>)}</ul>
        <form className="form" onSubmit={addRt}><select name="wd">{DIAS.map((n, i) => <option key={i} value={i}>{n}</option>)}</select><input name="title" placeholder="Atividade" required /><select name="category">{catOpts}</select><input name="min" type="number" min="0" defaultValue="60" /><button className="primary">Adicionar à rotina</button></form>
      </details>
    </>
  )
}
