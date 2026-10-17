import { useEffect, useRef, useState } from 'react'
import { notebook } from '../services/api'
import { Highlighted } from './NoteArea'
import { sanitize, decorate, caretOffset, setCaret, plainToHtml } from '../lib/richtext'

const SIZES = [['Pequeno', 14], ['Normal', 18], ['Grande', 26], ['Título', 36], ['Enorme', 48]]
const COLORS = ['#f3f3f3', '#6ea8ff', '#7ee0a3', '#ffd166', '#ff8a80', '#b8a8ff']
const SRC = { manual: 'Anotação', task: 'Tarefa', goal_log: 'Realização' }
const dmy = (d) => (d ? d.split('-').reverse().join('/') : '')
const Pencil = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>

// Anotação em tela cheia: leitura; lápis liga a edição com barra de ferramentas (formatação só no texto selecionado).
export default function NoteScreen({ note: first, subject, startEditing, onClose, onChanged, onDelete }) {
  const [note, setNote] = useState(first), [editing, setEditing] = useState(Boolean(startEditing)), [title, setTitle] = useState(first.title)
  const [err, setErr] = useState(''), [hint, setHint] = useState('')
  const ed = useRef(null), timer = useRef(null)
  useEffect(() => {
    if (!editing || !ed.current) return
    ed.current.innerHTML = note.body_html ? sanitize(note.body_html) : plainToHtml(note.body)
    decorate(ed.current); ed.current.focus()
  }, [editing]) // eslint-disable-line
  useEffect(() => {
    if (editing) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [editing, onClose])

  const flash = (m) => { setHint(m); setTimeout(() => setHint(''), 2200) }
  const hasSelection = () => { const s = getSelection(); return s.rangeCount > 0 && !s.isCollapsed && ed.current.contains(s.anchorNode) }
  const run = (name, val, css) => { ed.current.focus(); document.execCommand('styleWithCSS', false, Boolean(css)); document.execCommand(name, false, val) }
  function size(px) {
    if (!hasSelection()) return flash('Selecione o texto para mudar o tamanho')
    run('fontSize', '7') // marca a seleção; depois troca pelo tamanho em px escolhido
    ed.current.querySelectorAll('font[size="7"]').forEach((f) => {
      const sp = document.createElement('span'); sp.style.fontSize = px + 'px'; sp.append(...f.childNodes)
      sp.querySelectorAll('[style]').forEach((x) => { x.style.fontSize = '' }); f.replaceWith(sp)
    })
  }
  const onInput = () => { // recolore os comentários "//" depois de uma pausa na digitação
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { const o = caretOffset(ed.current); decorate(ed.current); if (o != null) setCaret(ed.current, o) }, 350)
  }
  async function save() {
    const t = title.trim(); if (!t) return setErr('Informe um título.')
    const html = sanitize(ed.current.innerHTML), plain = ed.current.innerText.replace(/\u200b/g, '').trim(), isNew = !note.id
    try {
      const saved = await notebook.saveNote({ ...(note.id ? { id: note.id } : { subject_id: note.subject_id, source_type: 'manual' }), title: t, body: plain || null, body_html: plain ? html : null })
      setNote(saved); setEditing(false); setErr(''); onChanged(); if (isNew) onClose()
    } catch (e) { setErr(e.message) }
  }
  const del = () => window.confirm(`Excluir a anotação "${note.title}"?`) && onDelete(note.id)
  const date = dmy(note.source_date || (note.created_at || '').slice(0, 10))
  return (
    <div className="screen">
      <header className="sbar">
        <button className="ghost" onClick={() => (editing && note.id ? (setEditing(false), setErr('')) : onClose())}>← {editing ? 'Cancelar' : 'Voltar'}</button>
        <div className="row">
          {editing ? <button className="primary" onClick={save}>Salvar</button> : <>
            {note.id && <button className="ghost" onClick={del}>Excluir</button>}
            <button className="icon" aria-label="Editar" title="Editar" onClick={() => { setTitle(note.title); setEditing(true) }}><Pencil /></button></>}
        </div>
      </header>
      <main className="swrap">
        <span className="pill">{subject.name} · {SRC[note.source_type] || 'Anotação'}{date && ` · ${date}`}</span>
        {editing ? <input className="stitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" aria-label="Título" /> : <h1 className="sh1">{note.title}</h1>}
        {err && <p role="alert" className="err">{err}</p>}
        {editing
          ? <div ref={ed} className="editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Texto da anotação" onInput={onInput}
              onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }} />
          : note.body_html ? <div className="rich" dangerouslySetInnerHTML={{ __html: sanitize(note.body_html) }} />
          : note.body ? <div className="plain"><Highlighted text={note.body} /></div> : <p className="muted">Sem descrição.</p>}
      </main>
      {editing && <>
        {hint && <div className="hint" role="status">{hint}</div>}
        <div className="tools" aria-label="Ferramentas de texto" onMouseDown={(e) => e.preventDefault()}>
          <button onClick={() => run('bold')} aria-label="Negrito"><b>B</b></button>
          <button onClick={() => run('italic')} aria-label="Itálico"><i>I</i></button>
          <button onClick={() => run('underline')} aria-label="Sublinhado"><u>U</u></button>
          <span className="sep" />
          {SIZES.map(([l, px]) => <button key={px} onClick={() => size(px)}>{l}</button>)}
          <span className="sep" />
          {COLORS.map((c) => <button key={c} className="sw" style={{ background: c }} aria-label={`Cor ${c}`} onClick={() => run('foreColor', c, true)} />)}
          <span className="sep" />
          <button onClick={() => run('insertText', '// ')} aria-label="Inserir comentário //">//</button>
          <button onClick={() => run('removeFormat')}>Limpar</button>
        </div></>}
    </div>
  )
}
