import { useEffect, useState } from 'react'
import { notebook } from '../services/api'
import NoteArea from './NoteArea'

// "Adicionar ao caderno": mostra as matérias para escolher onde a anotação também ficará guardada.
function CadernoPick({ value, onChange }) {
  const [open, setOpen] = useState(false), [subs, setSubs] = useState([]), [name, setName] = useState(''), [err, setErr] = useState('')
  useEffect(() => { if (value) setOpen(true) }, [value])
  useEffect(() => { if (open) notebook.subjects().then(setSubs).catch((e) => setErr(e.message)) }, [open])
  async function create() {
    const n = name.trim(); if (!n) return
    try { const s = await notebook.addSubject(n); setSubs([...subs, s]); onChange(s.id); setName(''); setErr('') }
    catch (e) { setErr(/duplicate/i.test(e.message) ? 'Já existe uma matéria com esse nome.' : e.message) }
  }
  return (
    <div className="pick">
      <button type="button" className={`ghost${value ? ' sel' : ''}`} onClick={() => setOpen(!open)}>{value ? '✓ Será adicionada ao caderno' : 'Adicionar ao caderno'}</button>
      {open && <div className="chips">
        {subs.map((s) => <button type="button" key={s.id} className={`chip${value === s.id ? ' on' : ''}`} onClick={() => onChange(value === s.id ? null : s.id)}>{s.name}</button>)}
        {subs.length === 0 && <span className="muted small">Nenhuma matéria ainda.</span>}
        <span className="row grow"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova matéria" aria-label="Nova matéria" /><button type="button" className="ghost" onClick={create}>Criar</button></span>
      </div>}
      {err && <p className="err small">{err}</p>}
    </div>
  )
}

export default function NoteForm({ nt, setNt, nb, setNb, subj, setSubj, titlePh, rows }) {
  return (
    <>
      <label>Título da anotação<input value={nt} onChange={(e) => setNt(e.target.value)} placeholder={titlePh} /></label>
      <label>Descrição <span className="small">(use // para comentários em verde)</span>
        <NoteArea value={nb} onChange={(e) => setNb(e.target.value)} rows={rows || 5} placeholder="O que você fez e aprendeu" /></label>
      <CadernoPick value={subj} onChange={setSubj} />
    </>
  )
}
