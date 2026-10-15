import { useCallback, useEffect, useState } from 'react'
import { goals } from '../services/api'
import { iso } from '../lib/util'

// Metas diárias: aparecem todo dia. "Feito" abre confirmação com título e descrição da anotação.
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
  return (
    <section className="card goals" aria-label="Metas de todo dia">
      <h2>Metas de todo dia</h2>
      {list.length === 0 ? <p className="empty">Nenhuma meta. Adicione uma abaixo.</p> :
        <ul className="list">{list.map((g) => { const log = logs.find((l) => l.goal_id === g.id); return (
          <li key={g.id} className={`goal${log ? ' done' : ''}`}>
            <div><b>{g.title}</b>{log?.note_title && <div className="muted small">Anotação: {log.note_title}</div>}</div>
            <div className="row">
              {log ? <><span className="pill on">Feito</span><button className="ghost" onClick={() => window.confirm('Desfazer este registro e apagar a anotação?') && run(() => goals.undo(log.id))}>Desfazer</button></>
                : <button className="primary" onClick={() => { setNt(''); setNb(''); setAsk(g) }}>Feito</button>}
              <button className="ghost x" aria-label={`Remover meta ${g.title}`} title="Remover meta" onClick={() => window.confirm(`Remover a meta "${g.title}"? Os registros anteriores continuam no mural.`) && run(() => goals.remove(g.id))}>×</button>
            </div>
          </li>) })}</ul>}
      <form className="row addgoal" onSubmit={add}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova meta diária" aria-label="Nova meta diária" /><button className="ghost">Adicionar</button></form>
      {ask && <div className="overlay"><div className="dialog" role="dialog" aria-modal="true">
        <h3>Marcar como feito?</h3><p className="muted">{ask.title}</p>
        <label>Título da anotação<input value={nt} onChange={(e) => setNt(e.target.value)} placeholder="Ex.: Two Sum" /></label>
        <label>Descrição<textarea rows="5" value={nb} onChange={(e) => setNb(e.target.value)} placeholder="O que você fez e aprendeu" /></label>
        <div className="row"><button className="primary" onClick={yes}>Sim</button><button className="ghost" onClick={() => setAsk(null)}>Não</button></div>
      </div></div>}
    </section>
  )
}
