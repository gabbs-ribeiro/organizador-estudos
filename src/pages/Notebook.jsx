import { useCallback, useEffect, useState } from 'react'
import { notebook } from '../services/api'
import NoteScreen from '../components/NoteScreen'

const SRC = { manual: 'Anotação', task: 'Tarefa', goal_log: 'Realização' }
const dmy = (d) => (d ? d.split('-').reverse().join('/') : '')

// Caderno: matérias (pastas) -> anotações. Clicar na matéria expande; clicar na anotação abre a tela cheia.
export default function Notebook() {
  const [subs, setSubs] = useState([]), [notes, setNotes] = useState([]), [open, setOpen] = useState(null), [err, setErr] = useState('')
  const [name, setName] = useState(''), [adding, setAdding] = useState(false), [screen, setScreen] = useState(null)
  const load = useCallback(async () => {
    try { const [s, n] = await Promise.all([notebook.subjects(), notebook.notes()]); setSubs(s); setNotes(n); setErr('') } catch (e) { setErr(e.message) }
  }, [])
  useEffect(() => { load() }, [load])
  const guard = async (fn) => { try { await fn(); await load() } catch (e) { setErr(/duplicate/i.test(e.message) ? 'Já existe uma matéria com esse nome.' : e.message) } }
  const addSub = (e) => { e.preventDefault(); const n = name.trim(); if (!n) return; guard(async () => { const s = await notebook.addSubject(n); setOpen(s.id); setName(''); setAdding(false) }) }
  const delSub = (s, count) => window.confirm(`Excluir a matéria "${s.name}" e suas ${count} anotações? Isso não pode ser desfeito.`) && guard(() => notebook.removeSubject(s.id))
  return (
    <>
      <div className="row between wrap"><h1>Caderno</h1><button className="primary" onClick={() => setAdding(!adding)}>Nova matéria</button></div>
      {adding && <form className="row addgoal" onSubmit={addSub}><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da matéria (ex.: Java)" aria-label="Nome da matéria" /><button className="primary">Criar</button></form>}
      {err && <p role="alert" className="err">{err}</p>}
      {subs.length === 0 ? <p className="empty">Nenhuma matéria ainda. Crie uma pasta para começar (ex.: Java, Algoritmos, Banco de dados).</p> :
        subs.map((s) => {
          const list = notes.filter((n) => n.subject_id === s.id), isOpen = open === s.id
          return (
            <section key={s.id} className={`folder${isOpen ? ' open' : ''}`}>
              <button className="fh" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                <span className="chev" aria-hidden="true">▸</span><span className="name">{s.name}</span><span className="pill">{list.length}</span></button>
              {isOpen && <div className="fbody">
                {list.length === 0 ? <p className="empty">Nenhuma anotação nesta matéria.</p> : list.map((n) =>
                  <button key={n.id} className="entry" onClick={() => setScreen({ note: n, subject: s })}><span className="et">{n.title}</span><span className="muted small">{SRC[n.source_type]} · {dmy(n.source_date || n.created_at.slice(0, 10))}</span></button>)}
                <div className="row wrap" style={{ marginTop: '.6rem' }}>
                  <button className="primary" onClick={() => setScreen({ note: { subject_id: s.id, title: '', body: null, body_html: null, source_type: 'manual' }, subject: s, editing: true })}>Nova anotação</button>
                  <button className="ghost" onClick={() => delSub(s, list.length)}>Excluir matéria</button></div>
              </div>}
            </section>)
        })}
      {screen && <NoteScreen key={screen.note.id || 'nova'} note={screen.note} subject={screen.subject} startEditing={screen.editing}
        onClose={() => setScreen(null)} onChanged={load} onDelete={(id) => { setScreen(null); guard(() => notebook.removeNote(id)) }} />}
    </>
  )
}
