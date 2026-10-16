import { useCallback, useEffect, useState } from 'react'
import { notebook } from '../services/api'
import NoteArea from '../components/NoteArea'
import Viewer from '../components/Viewer'

const SRC = { manual: 'Anotação', task: 'Tarefa', goal_log: 'Realização' }
const dmy = (d) => (d ? d.split('-').reverse().join('/') : '')

// Caderno: matérias (pastas) -> anotações. Clicar na matéria expande; clicar na anotação abre o leitor.
export default function Notebook() {
  const [subs, setSubs] = useState([]), [notes, setNotes] = useState([]), [open, setOpen] = useState(null), [err, setErr] = useState('')
  const [name, setName] = useState(''), [adding, setAdding] = useState(false), [edit, setEdit] = useState(null), [view, setView] = useState(null)
  const load = useCallback(async () => {
    try { const [s, n] = await Promise.all([notebook.subjects(), notebook.notes()]); setSubs(s); setNotes(n); setErr('') } catch (e) { setErr(e.message) }
  }, [])
  useEffect(() => { load() }, [load])
  const guard = async (fn) => { try { await fn(); await load() } catch (e) { setErr(/duplicate/i.test(e.message) ? 'Já existe uma matéria com esse nome.' : e.message) } }
  const addSub = (e) => { e.preventDefault(); const n = name.trim(); if (!n) return; guard(async () => { const s = await notebook.addSubject(n); setOpen(s.id); setName(''); setAdding(false) }) }
  const delSub = (s, count) => window.confirm(`Excluir a matéria "${s.name}" e suas ${count} anotações? Isso não pode ser desfeito.`) && guard(() => notebook.removeSubject(s.id))
  function saveNote(e) {
    e.preventDefault()
    if (!edit.title.trim()) return setErr('Informe um título.')
    guard(async () => {
      await notebook.saveNote(edit.id ? { id: edit.id, title: edit.title.trim(), body: edit.body.trim() || null } : { subject_id: edit.subject_id, source_type: 'manual', title: edit.title.trim(), body: edit.body.trim() || null })
      setEdit(null)
    })
  }
  const openNote = (n, s) => setView({
    kind: SRC[n.source_type], date: dmy(n.source_date || n.created_at.slice(0, 10)), title: n.title, sub: s.name, body: n.body,
    actions: <>
      <button className="ghost" onClick={() => { setView(null); setEdit({ id: n.id, title: n.title, body: n.body || '' }) }}>Editar</button>
      <button className="ghost" onClick={() => window.confirm(`Excluir a anotação "${n.title}"?`) && (setView(null), guard(() => notebook.removeNote(n.id)))}>Excluir</button></>,
  })
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
                  <button key={n.id} className="entry" onClick={() => openNote(n, s)}><span className="et">{n.title}</span><span className="muted small">{SRC[n.source_type]} · {dmy(n.source_date || n.created_at.slice(0, 10))}</span></button>)}
                <div className="row wrap" style={{ marginTop: '.6rem' }}>
                  <button className="primary" onClick={() => setEdit({ subject_id: s.id, title: '', body: '' })}>Nova anotação</button>
                  <button className="ghost" onClick={() => delSub(s, list.length)}>Excluir matéria</button></div>
              </div>}
            </section>)
        })}
      {edit && <div className="overlay"><form className="dialog wide" onSubmit={saveNote}>
        <h3>{edit.id ? 'Editar anotação' : 'Nova anotação'}</h3>
        <label>Título<input autoFocus value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
        <label>Descrição <span className="small">(use // para comentários em verde)</span><NoteArea rows={12} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></label>
        <div className="row"><button className="primary">Salvar</button><button type="button" className="ghost" onClick={() => setEdit(null)}>Cancelar</button></div>
      </form></div>}
      {view && <Viewer v={view} onClose={() => setView(null)} />}
    </>
  )
}
