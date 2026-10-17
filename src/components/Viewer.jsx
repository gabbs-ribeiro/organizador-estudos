import { useEffect, useState } from 'react'
import { Highlighted } from './NoteArea'
import { notebook } from '../services/api'

// Botão no canto superior esquerdo: guarda a anotação (título + descrição) numa matéria do caderno, onde pode ser editada.
function AddToNotebook({ src }) {
  const [open, setOpen] = useState(false), [subs, setSubs] = useState([]), [cur, setCur] = useState(null)
  const [name, setName] = useState(''), [msg, setMsg] = useState(''), [err, setErr] = useState('')
  useEffect(() => { notebook.bySource(src.type, src.id).then((n) => n && setCur(n.subject_id)).catch(() => {}) }, [src.type, src.id])
  useEffect(() => { if (open) notebook.subjects().then(setSubs).catch((e) => setErr(e.message)) }, [open])
  async function save(s) {
    try {
      if (cur) await notebook.moveBySource(src.type, src.id, s.id) // já está no caderno: só troca de matéria (não sobrescreve edições)
      else await notebook.linked({ subject_id: s.id, title: src.title, body: src.body || null, source_type: src.type, source_id: src.id, source_date: src.date })
      setCur(s.id); setMsg(`Guardada em "${s.name}". Você pode editá-la no Caderno.`); setOpen(false); setErr('')
    } catch (e) { setErr(e.message) }
  }
  async function create() {
    const n = name.trim(); if (!n) return
    try { const s = await notebook.addSubject(n); setSubs([...subs, s]); setName(''); await save(s) }
    catch (e) { setErr(/duplicate/i.test(e.message) ? 'Já existe uma matéria com esse nome.' : e.message) }
  }
  return (
    <>
      <button className={`ghost addnb${cur ? ' sel' : ''}`} onClick={() => setOpen(!open)}>{cur ? '✓ No caderno' : 'Adicionar ao caderno'}</button>
      {(open || msg || err) && <div className="panel">
        {open && <>
          <p className="small muted">{cur ? 'Escolha outra matéria para mover a anotação.' : 'Escolha a matéria:'}</p>
          <div className="chips">
            {subs.map((s) => <button key={s.id} className={`chip${cur === s.id ? ' on' : ''}`} onClick={() => save(s)}>{s.name}</button>)}
            {subs.length === 0 && <span className="muted small">Nenhuma matéria ainda.</span>}
            <span className="row grow"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova matéria" aria-label="Nova matéria" /><button className="ghost" onClick={create}>Criar</button></span>
          </div></>}
        {msg && <p className="ok small">{msg}</p>}{err && <p className="err small">{err}</p>}
      </div>}
    </>
  )
}

// Leitor: anotação em tela cheia (celular) / folha grande (PC) para estudar o conteúdo.
export default function Viewer({ v, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose}>
      <article className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="topbar">
          {v.addSource ? <AddToNotebook src={v.addSource} /> : <span />}
          <div className="row">{v.actions}<button className="ghost" onClick={onClose}>Fechar</button></div>
        </div>
        <span className="pill kindpill">{v.kind} · {v.date}</span>
        <h2>{v.title}</h2>
        {v.sub && <p className="muted">{v.sub}</p>}
        <div className="body">{v.body ? <Highlighted text={v.body} /> : <span className="muted">Sem descrição registrada.</span>}</div>
        {v.meta && <p className="muted small">{v.meta}</p>}
      </article>
    </div>
  )
}
