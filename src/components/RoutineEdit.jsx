import { useState } from 'react'
import { routines } from '../services/api'
import { DIAS, TASK_CATS, today, rangeText, stripRange } from '../lib/util'

// Edição completa de uma atividade da rotina padrão: dia, título, categoria, horário de início, duração e descrição.
export default function RoutineEdit({ r, onClose, onSaved, onError }) {
  const [wd, setWd] = useState(String(r.weekday)), [title, setTitle] = useState(r.title), [cat, setCat] = useState(r.category)
  const [start, setStart] = useState((r.start_time || '').slice(0, 5)), [mins, setMins] = useState(String(r.minutes)), [desc, setDesc] = useState(stripRange(r.description))
  const [apply, setApply] = useState(true), [err, setErr] = useState('')
  const n = Math.max(0, parseInt(mins, 10) || 0), range = rangeText(start, n)
  async function save(e) {
    e.preventDefault()
    if (!title.trim()) return setErr('Informe o nome da atividade.')
    const description = [range, desc.trim()].filter(Boolean).join(' · ') || null
    const patch = { title: title.trim(), category: cat, minutes: n, start_time: start || null, description }
    try {
      await routines.update(r.id, { weekday: +wd, ...patch })
      if (apply && +wd === r.weekday) await routines.applyToTasks(r.id, { title: patch.title, category: cat, est_minutes: n, start_time: patch.start_time, description }, today())
      onSaved()
    } catch (x) { onError(x.message); onClose() }
  }
  return (
    <div className="overlay"><form className="dialog wide" onSubmit={save}>
      <h3>Editar atividade da rotina</h3>
      <label>Dia da semana<select value={wd} onChange={(e) => setWd(e.target.value)}>{DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></label>
      <label>Atividade<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Categoria<select value={cat} onChange={(e) => setCat(e.target.value)}>{Object.entries(TASK_CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <div className="row wrap">
        <label>Horário de início<input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>Duração (min)<input type="number" min="0" value={mins} onChange={(e) => setMins(e.target.value)} /></label>
      </div>
      <p className="small muted">{range ? `Faixa: ${range}` : 'Sem horário fixo (defina início e duração para ver a faixa).'}</p>
      <label>Descrição<textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
      {+wd === r.weekday
        ? <label className="chk-row"><input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} /> Aplicar também às tarefas pendentes já geradas (de hoje em diante)</label>
        : <p className="small muted">Ao mudar o dia, só as próximas semanas geradas seguem o novo dia.</p>}
      {err && <p role="alert" className="err small">{err}</p>}
      <div className="row"><button className="primary">Salvar</button><button type="button" className="ghost" onClick={onClose}>Cancelar</button></div>
    </form></div>
  )
}
