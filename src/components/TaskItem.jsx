import { useEffect, useState } from 'react'
import { STATUS, TASK_CATS, fmtMin, iso } from '../lib/util'
import { tasks } from '../services/api'

// Fluxo: Iniciar (confirma) -> Finalizar (confirma + tempo real opcional).
// Tempo real: sugere o estimado; vazio = não contabiliza nas estatísticas.
export default function TaskItem({ t, onChange, onError, big }) {
  const [ask, setAsk] = useState(null), [mins, setMins] = useState('')
  async function patch(p) { try { await tasks.update(t.id, p); onChange() } catch (e) { onError(e.message) } }
  function open(kind) { setMins(String(t.est_minutes)); setAsk(kind) }
  function yes() {
    if (ask === 'start') patch({ status: 'em_andamento' })
    else { const n = parseInt(mins, 10); patch({ status: 'concluida', actual_minutes: mins.trim() === '' || Number.isNaN(n) || n < 0 ? null : n }) }
    setAsk(null)
  }
  const other = (v) => v && patch({ status: v, actual_minutes: null })
  const move = (date) => date && date !== t.task_date && patch({ task_date: date, status: 'pendente', actual_minutes: null })
  const done = t.status === 'concluida'
  const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(i) }, [])
  // faixa de horário no começo da descrição (ex.: 19h30–21h45): verde, ou vermelha se já passou do início sem iniciar
  const m = (t.description || '').match(/^\d{1,2}h\d{2}\s*[–-]\s*\d{1,2}h\d{2}/)
  const rest = m ? t.description.slice(m[0].length).replace(/^\s*·\s*/, '') : t.description
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = (t.start_time || '').split(':').map(Number)
  const started = Boolean(t.start_time) && (t.task_date < iso(now) || (t.task_date === iso(now) && nowMin >= sh * 60 + sm))
  const late = t.status === 'pendente' && started
  return (
    <li className={`task st-${t.status}${big ? ' big' : ''}`}>
      <div><b>{t.title}</b> <span className="pill">{STATUS[t.status]}</span>
        <div className="muted">{t.start_time && `${t.start_time.slice(0, 5)} · `}{TASK_CATS[t.category] || t.category} · {fmtMin(t.est_minutes)} previstos{t.actual_minutes != null && ` · ${fmtMin(t.actual_minutes)} reais`}</div>
        {t.description && <p className="muted small">{m && <span className={`tm ${late ? 'late' : 'on'}`}>{m[0]}</span>}{m && rest ? ' · ' : ''}{rest}</p>}</div>
      <div className="actions">
        {t.status === 'em_andamento' ? <button className="primary cta" onClick={() => open('finish')}>Finalizar</button>
          : !done && <button className="primary cta" onClick={() => open('start')}>Iniciar</button>}
        <div className="sec">
        <select aria-label="Outras ações" value="" onChange={(e) => other(e.target.value)}>
          <option value="">Outras ações</option>
          {done ? <option value="pendente">Reabrir</option> : <>
            <option value="adiada">Adiar</option><option value="nao_realizada">Não realizada</option>
            {t.status !== 'pendente' && <option value="pendente">Voltar para pendente</option>}</>}
        </select>
        <input type="date" aria-label="Remarcar para outro dia" title="Remarcar para outro dia" value={t.task_date} onChange={(e) => move(e.target.value)} />
        </div>
      </div>
      {ask && <div className="overlay" onClick={() => setAsk(null)}>
        <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h3>{ask === 'start' ? 'Iniciar esta atividade?' : 'Finalizar esta atividade?'}</h3>
          <p className="muted">{t.title}</p>
          {ask === 'finish' && <label>Tempo real em minutos (deixe vazio para não contabilizar)
            <input type="number" min="0" value={mins} onChange={(e) => setMins(e.target.value)} autoFocus /></label>}
          <div className="row"><button className="primary" onClick={yes}>Sim</button><button className="ghost" onClick={() => setAsk(null)}>Não</button></div>
        </div></div>}
    </li>
  )
}
