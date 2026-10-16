import { useCallback, useEffect, useState } from 'react'
import { exercises, attempts } from '../services/api'
import { PLAT, CATS, DIF, EXST, today } from '../lib/util'

const EMPTY = { title: '', platform: 'leetcode', category: 'algoritmos', difficulty: 'facil', statement: '', first_attempt: '', code: '', notes: '', errors: '', learned: '', next_steps: '', first_attempt_date: today(), solved_date: '', status: 'tentando' }
const opts = (o) => Object.entries(o).map(([k, v]) => <option key={k} value={k}>{v}</option>)

export default function Exercicios() {
  const [list, setList] = useState([]), [form, setForm] = useState(null), [open, setOpen] = useState(null), [err, setErr] = useState('')
  const [f, setF] = useState({ q: '', platform: '', category: '', difficulty: '', status: '' })
  const load = useCallback(async () => { try { setList(await exercises.list()); setErr('') } catch (e) { setErr(e.message) } }, [])
  useEffect(() => { load() }, [load])
  const shown = list.filter((x) => (!f.platform || x.platform === f.platform) && (!f.category || x.category === f.category) && (!f.difficulty || x.difficulty === f.difficulty) && (!f.status || x.status === f.status)
    && (!f.q || [x.title, x.statement, x.code, x.notes, x.errors, x.learned].join(' ').toLowerCase().includes(f.q.toLowerCase())))
  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return setErr('Informe um título.')
    const { created_at, updated_at, user_id, ...row } = form
    row.solved_date = row.solved_date || null
    try { await exercises.save(row); setForm(null); load() } catch (x) { setErr(x.message) }
  }
  async function del(x) { if (window.confirm(`Excluir "${x.title}" e todas as tentativas?`)) try { await exercises.remove(x.id); load() } catch (e) { setErr(e.message) } }
  const dup = (x) => { const { id, created_at, updated_at, user_id, ...r } = x; setForm({ ...r, title: x.title + ' (cópia)', status: 'tentando', solved_date: '' }) }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  if (form) return (
    <form className="form col" onSubmit={save}>
      <h1>{form.id ? 'Editar exercício' : 'Novo exercício'}</h1>{err && <p role="alert" className="err">{err}</p>}
      <input placeholder="Título" value={form.title} onChange={set('title')} required />
      <div className="row wrap"><select aria-label="Plataforma" value={form.platform} onChange={set('platform')}>{opts(PLAT)}</select><select aria-label="Categoria" value={form.category} onChange={set('category')}>{opts(CATS)}</select><select aria-label="Dificuldade" value={form.difficulty} onChange={set('difficulty')}>{opts(DIF)}</select><select aria-label="Status" value={form.status} onChange={set('status')}>{opts(EXST)}</select></div>
      <div className="row wrap"><label>Primeira tentativa<input type="date" value={form.first_attempt_date} onChange={set('first_attempt_date')} /></label><label>Resolvido em<input type="date" value={form.solved_date || ''} onChange={set('solved_date')} /></label></div>
      {[['statement', 'Enunciado'], ['first_attempt', 'Minha tentativa inicial'], ['errors', 'Erros encontrados'], ['notes', 'Anotações'], ['learned', 'O que aprendi'], ['next_steps', 'Próximos passos / dúvidas']].map(([k, l]) => <label key={k}>{l}<textarea rows="3" value={form[k] || ''} onChange={set(k)} /></label>)}
      <label>Código da solução<textarea className="code" rows="10" spellCheck="false" value={form.code || ''} onChange={set('code')} onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); const t = e.target, s = t.selectionStart; setForm({ ...form, code: t.value.slice(0, s) + '    ' + t.value.slice(t.selectionEnd) }); requestAnimationFrame(() => (t.selectionStart = t.selectionEnd = s + 4)) } }} /></label>
      <div className="row"><button className="primary">Salvar exercício</button><button type="button" className="ghost" onClick={() => setForm(null)}>Cancelar</button></div>
    </form>)
  return (
    <>
      <div className="row between"><h1>Exercícios</h1><button className="primary" onClick={() => setForm({ ...EMPTY })}>Novo exercício</button></div>
      {err && <p role="alert" className="err">{err}</p>}
      <div className="row wrap filters"><input type="search" placeholder="Pesquisar…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        {[['platform', 'Plataforma', PLAT], ['category', 'Categoria', CATS], ['difficulty', 'Dificuldade', DIF], ['status', 'Status', EXST]].map(([k, l, o]) => <select key={k} aria-label={l} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">{l}: todos</option>{opts(o)}</select>)}</div>
      {shown.length === 0 ? <p className="empty">{list.length ? 'Nenhum exercício com esses filtros.' : 'Nenhum exercício ainda. Registre o primeiro.'}</p> :
        <ul className="list">{shown.map((x) => <li key={x.id} className="task col">
          <div className="row between"><div><b>{x.title}</b><span className="muted"> {PLAT[x.platform]} · {CATS[x.category]} · {DIF[x.difficulty]}</span></div><span className={`pill s-${x.status}`}>{EXST[x.status]}</span></div>
          <div className="row wrap"><button className="ghost" onClick={() => setOpen(open === x.id ? null : x.id)}>{open === x.id ? 'Fechar' : 'Abrir'}</button><button className="ghost" onClick={() => setForm({ ...x, solved_date: x.solved_date || '' })}>Editar</button><button className="ghost" onClick={() => dup(x)}>Duplicar</button><button className="ghost" onClick={() => del(x)}>Excluir</button></div>
          {open === x.id && <Detail x={x} onError={setErr} />}</li>)}</ul>}
    </>)
}

function Detail({ x, onError }) {
  const [att, setAtt] = useState([]), [a, setA] = useState({ attempt_date: today(), content: '', errors: '', help_type: '', result: '', clearer: '' })
  const load = useCallback(() => attempts.list(x.id).then(setAtt).catch((e) => onError(e.message)), [x.id, onError])
  useEffect(() => { load() }, [load])
  async function add(e) { e.preventDefault(); try { await attempts.add({ ...a, exercise_id: x.id }); setA({ ...a, content: '', errors: '', help_type: '', result: '', clearer: '' }); load() } catch (er) { onError(er.message) } }
  const F = ([l, v]) => v ? <p key={l}><b>{l}:</b> {v}</p> : null
  const s = (k) => (e) => setA({ ...a, [k]: e.target.value })
  return (<div className="detail">
    {[['Enunciado', x.statement], ['Tentativa inicial', x.first_attempt], ['Erros', x.errors], ['Anotações', x.notes], ['Aprendizados', x.learned], ['Próximos passos', x.next_steps]].map(F)}
    {x.code && <pre className="code">{x.code}</pre>}
    <h3>Tentativas</h3>
    {att.length === 0 && <p className="empty">Nenhuma tentativa registrada.</p>}
    {att.map((t) => <div key={t.id} className="attempt"><b>{t.attempt_date}</b>{t.result && ` · ${t.result}`}{t.help_type && ` · ajuda: ${t.help_type}`}
      {[['Raciocínio/código', t.content], ['Erros', t.errors], ['Ficou mais claro', t.clearer]].map(F)}
      <button className="ghost" onClick={() => window.confirm('Excluir tentativa?') && attempts.remove(t.id).then(load).catch((e) => onError(e.message))}>Excluir</button></div>)}
    <form className="form col" onSubmit={add}><input type="date" value={a.attempt_date} onChange={s('attempt_date')} />
      <textarea className="code" rows="4" placeholder="Código ou raciocínio" value={a.content} onChange={s('content')} />
      <input placeholder="Erros encontrados" value={a.errors} onChange={s('errors')} />
      <input placeholder="Tipo de ajuda (nenhuma, dica, solução…)" value={a.help_type} onChange={s('help_type')} />
      <input placeholder="Resultado (passou, falhou…)" value={a.result} onChange={s('result')} />
      <input placeholder="O que ficou mais claro" value={a.clearer} onChange={s('clearer')} />
      <button className="primary">Registrar tentativa</button></form></div>)
}
