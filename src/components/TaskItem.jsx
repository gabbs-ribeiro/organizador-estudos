import { STATUS, CATS, fmtMin } from '../lib/util'
import { tasks } from '../services/api'
// Concluir pergunta o tempo real (sugere o estimado; vazio = não contabiliza).
export default function TaskItem({ t, onChange, onError }) {
  async function setStatus(status) {
    const patch = { status }
    if (status === 'concluida') {
      const v = window.prompt('Tempo real em minutos (deixe vazio para não contabilizar):', String(t.est_minutes))
      if (v === null) return
      const n = parseInt(v, 10)
      patch.actual_minutes = v.trim() === '' || Number.isNaN(n) || n < 0 ? null : n
    } else patch.actual_minutes = null
    try { await tasks.update(t.id, patch); onChange() } catch (e) { onError(e.message) }
  }
  async function move(date) {
    if (!date) return
    try { await tasks.update(t.id, { task_date: date, status: 'pendente' }); onChange() } catch (e) { onError(e.message) }
  }
  async function del() {
    if (!window.confirm(`Excluir "${t.title}"?`)) return
    try { await tasks.remove(t.id); onChange() } catch (e) { onError(e.message) }
  }
  return (
    <li className={`task st-${t.status}`}>
      <div><b>{t.title}</b><span className="muted"> {CATS[t.category] || t.category} · {fmtMin(t.est_minutes)} previstos{t.actual_minutes != null && ` · ${fmtMin(t.actual_minutes)} reais`}</span>
        {t.description && <p className="muted small">{t.description}</p>}</div>
      <div className="row wrap">
        <select aria-label="Status" value={t.status} onChange={(e) => setStatus(e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="date" aria-label="Remarcar para outro dia" title="Remarcar para outro dia" value="" onChange={(e) => move(e.target.value)} />
        <button className="ghost" onClick={del}>Excluir</button>
      </div>
    </li>
  )
}
