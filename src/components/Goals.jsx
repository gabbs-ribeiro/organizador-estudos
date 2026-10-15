import { useCallback, useEffect, useState } from 'react'
import { goals } from '../services/api'
import { iso } from '../lib/util'

// Anel de progresso pequeno; em 100% vira um V verde.
function Ring({ pct }) {
  if (pct >= 100) return <svg className="ring" viewBox="0 0 44 44" role="img" aria-label="Todas as metas concluídas"><circle cx="22" cy="22" r="20" fill="var(--ok)" /><path d="M13 23l6 6 12-13" fill="none" stroke="#06231f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  return (
    <svg className="ring" viewBox="0 0 44 44" role="img" aria-label={`${pct}% das metas concluídas`}>
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--card2)" strokeWidth="6" />
      {pct > 0 && <circle className="arc" cx="22" cy="22" r="18" fill="none" stroke="var(--ac)" strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct} 100`} transform="rotate(-90 22 22)" />}
    </svg>
  )
}

// Metas: lista "a fazer" / "concluídas" de hoje. "Feito" abre confirmação com título e descrição da anotação.
export default function Goals({ onError }) {
  const [list, setList] = useState([]), [logs, setLogs] = useState([]), [ask, setAsk] = useState(null)
  const [nt, setNt] = useState(''), [nb, setNb] = useState(''), [title, setTitle] = useState('')
  const day = iso(new Date())
  const load = useCallback(async () => {
    try { setList(await goals.list()); setLogs(await goals.logs(day, day)) } catch (e) { onError(e.message) }
  }, [day, onError])
  useEffect(() => { load() }, [load])
  const run = async (fn) => { try { await fn(); load() } catch (e) { onError(e.message) } }
  const yes = () => { const g = ask; setAsk(null); run(() => goals.done({ goal_id: g.id, log_date: day, note_title: nt.trim() || null, note_body: nb.trim() || null })) }
  const add = (e) => { e.preventDefault(); if (!title.trim()) return; run(() => goals.add(title.trim())); setTitle('') }
  const logOf = (g) => logs.find((l) => l.goal_id === g.id)
  const todo = list.filter((g) => !logOf(g)), finished = list.filter((g) => logOf(g))
  const pct = list.length ? Math.round((finished.length / list.length) * 100) : 0
  const rm = (g) => window.confirm(`Remover a meta "${g.title}"? Os registros anteriores continuam no mural.`) && run(() => goals.remove(g.id))
  const X = (g) => <button className="x" aria-label={`Remover meta ${g.title}`} title="Remover meta" onClick={() => rm(g)}>×</button>
  const Check = () => <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  return (
    <section className="card goals" aria-label="Metas">
      <div className="goals-head"><Ring pct={pct} /><div><h2>Metas</h2><span className="muted small">{list.length ? `${finished.length} de ${list.length} feitas hoje · ${pct}%` : 'Sem metas ainda'}</span></div></div>
      {list.length > 0 && <>
        <h3 className="todo-h">A fazer ({todo.length})</h3>
        {todo.length === 0 ? <p className="ok small">Tudo feito por hoje.</p> :
          <ul className="list">{todo.map((g) => <li key={g.id} className="goal todo"><div className="left">
            <button className="chk" aria-label={`Marcar "${g.title}" como feita`} title="Marcar como feita" onClick={() => { setNt(''); setNb(''); setAsk(g) }} />
            <div className="t"><b>{g.title}</b></div></div>{X(g)}</li>)}</ul>}
        {finished.length > 0 && <>
          <h3 className="todo-h">Concluídas ({finished.length})</h3>
          <ul className="list">{finished.map((g) => { const log = logOf(g); return <li key={g.id} className="goal done"><div className="left">
            <button className="chk" aria-label={`Desfazer "${g.title}"`} title="Desfazer" onClick={() => window.confirm('Desfazer este registro e apagar a anotação?') && run(() => goals.undo(log.id))}><Check /></button>
            <div className="t"><b>{g.title}</b>{log.note_title && <span className="muted small nt">· {log.note_title}</span>}</div></div>{X(g)}</li> })}</ul></>}
      </>}
      <form className="row addgoal" onSubmit={add}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova meta" aria-label="Nova meta" /><button className="ghost">Adicionar</button></form>
      {ask && <div className="overlay"><div className="dialog" role="dialog" aria-modal="true">
        <h3>Marcar como feito?</h3><p className="muted">{ask.title}</p>
        <label>Título da anotação<input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Ex.: Two Sum" /></label>
        <label>Descrição<textarea rows="5" value={nb} onChange={(e) => setNb(e.target.value)} placeholder="O que você fez e aprendeu" /></label>
        <div className="row"><button className="primary" onClick={yes}>Sim</button><button className="ghost" onClick={() => setAsk(null)}>Não</button></div>
      </div></div>}
    </section>
  )
}
