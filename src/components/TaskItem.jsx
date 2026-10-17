import { useEffect, useState } from 'react'
import { STATUS, TASK_CATS, fmtMin, fmtDur, iso } from '../lib/util'
import { tasks, notebook } from '../services/api'
import NoteForm from './NoteForm'

const secsSince = (d) => (d ? Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000)) : 0)
const RESET = { actual_minutes: null, work_seconds: 0, paused_seconds: 0, segment_started_at: null }
const PauseIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
const PlayIcon = () => <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>

// Fluxo: Iniciar -> (Pausar/Retomar) -> Finalizar. Tempo em atividade e tempo pausado são contados separados.
// Tempo: calculado automaticamente do início ao fim; o tempo pausado não conta.
export default function TaskItem({ t, onChange, onError, big }) {
  const [ask, setAsk] = useState(null), [subj, setSubj] = useState(null), [nt, setNt] = useState(''), [nb, setNb] = useState('')
  const running = t.status === 'em_andamento', paused = t.status === 'pausada', done = t.status === 'concluida'
  const totals = () => ({
    w: (t.work_seconds || 0) + (running ? secsSince(t.segment_started_at) : 0),
    p: (t.paused_seconds || 0) + (paused ? secsSince(t.segment_started_at) : 0),
  })
  async function patch(p) { try { await tasks.update(t.id, p); onChange(); return true } catch (e) { onError(e.message); return false } }
  function open(kind) {
    setNt(t.note_title || ''); setNb(t.note_body || ''); setSubj(null); setAsk(kind)
    if (kind !== 'start') notebook.bySource('task', t.id).then((n) => n && setSubj(n.subject_id)).catch(() => {})
  }
  // "Adicionar ao caderno": copia/atualiza a anotação na matéria escolhida (sem duplicar); sem matéria, remove o vínculo
  async function syncNotebook() {
    try {
      if (subj && (nt.trim() || nb.trim())) await notebook.linked({ subject_id: subj, title: nt.trim() || t.title, body: nb.trim() || null, source_type: 'task', source_id: t.id, source_date: t.task_date })
      else await notebook.unlink('task', t.id)
    } catch (e) { onError(e.message) }
  }
  const notes = () => ({ note_title: nt.trim() || null, note_body: nb.trim() || null })
  const nowIso = () => new Date().toISOString()
  const pause = () => patch({ status: 'pausada', work_seconds: totals().w, segment_started_at: nowIso() })
  const resume = () => patch({ status: 'em_andamento', paused_seconds: totals().p, segment_started_at: nowIso() })
  async function yes() {
    const kind = ask; setAsk(null)
    let ok
    if (kind === 'start') ok = await patch({ status: 'em_andamento', work_seconds: 0, paused_seconds: 0, segment_started_at: nowIso() })
    else if (kind === 'finish') {
      const { w, p } = totals() // tempo calculado do início ao fim, sem as pausas
      ok = await patch({ status: 'concluida', work_seconds: w, paused_seconds: p, segment_started_at: null, actual_minutes: Math.round(w / 60), ...notes() })
    } else ok = await patch(notes())
    if (ok && kind !== 'start') syncNotebook()
  }
  const other = (v) => v && patch({ status: v, ...RESET })
  const move = (date) => date && date !== t.task_date && patch({ task_date: date, status: 'pendente', ...RESET })
  const [, tick] = useState(0)
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), running || paused ? 1000 : 30000); return () => clearInterval(i) }, [running, paused])
  // faixa de horário no começo da descrição (ex.: 19h30–21h45): verde, ou vermelha se já passou do início sem iniciar
  const m = (t.description || '').match(/^\d{1,2}h\d{2}\s*[–-]\s*\d{1,2}h\d{2}/)
  const rest = m ? t.description.slice(m[0].length).replace(/^\s*·\s*/, '') : t.description
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = (t.start_time || '').split(':').map(Number)
  const started = Boolean(t.start_time) && (t.task_date < iso(now) || (t.task_date === iso(now) && nowMin >= sh * 60 + sm))
  const late = t.status === 'pendente' && started
  const { w, p } = totals()
  const tracked = running || paused || w > 0 || p > 0
  const title = { start: 'Iniciar esta atividade?', finish: 'Finalizar esta atividade?', note: 'Anotações da atividade' }[ask]
  return (
    <li className={`task st-${t.status}${big ? ' big' : ''}`}>
      <div><b>{t.title}</b> <span className="pill">{STATUS[t.status]}</span>
        <div className="muted">{t.start_time && `${t.start_time.slice(0, 5)} · `}{TASK_CATS[t.category] || t.category} · {fmtMin(t.est_minutes)} previstos{t.actual_minutes != null && !tracked && ` · ${fmtMin(t.actual_minutes)} reais`}</div>
        {tracked && <p className="small muted">Em atividade {fmtDur(w)} · Pausado {fmtDur(p)}</p>}
        {t.description && <p className="muted small">{m && <span className={`tm ${late ? 'late' : 'on'}`}>{m[0]}</span>}{m && rest ? ' · ' : ''}{rest}</p>}
        {t.note_title && <p className="small note-t">Anotação: {t.note_title}</p>}</div>
      <div className="actions">
        {running || paused ? <div className="main-act">
          <button className="primary cta" onClick={() => open('finish')}>Finalizar</button>
          <button className={`round${paused ? ' resume' : ''}`} onClick={paused ? resume : pause} aria-label={paused ? 'Retomar' : 'Pausar'} title={paused ? 'Retomar' : 'Pausar'}>{paused ? <PlayIcon /> : <PauseIcon />}</button>
        </div> : !done && <button className="primary cta" onClick={() => open('start')}>Iniciar</button>}
        <div className="sec">
          <select aria-label="Ações" value="" onChange={(e) => other(e.target.value)}>
            <option value="">Ações</option>
            {done ? <option value="pendente">Reabrir</option> : <>
              {t.status !== 'adiada' && <option value="adiada">Adiar (vai para Pendentes)</option>}<option value="nao_realizada">Não realizada (remove da lista)</option>
              {t.status !== 'pendente' && <option value="pendente">Voltar para pendente</option>}</>}
          </select>
          {(running || paused || done) && <button className="ghost" onClick={() => open('note')}>Anotações</button>}
          <input type="date" aria-label="Remarcar para outro dia" title="Remarcar para outro dia" value={t.task_date} onChange={(e) => move(e.target.value)} />
        </div>
      </div>
      {ask && <div className="overlay" onClick={() => ask === 'start' && setAsk(null)}>
        <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <h3>{title}</h3>
          <p className="muted">{t.title}</p>
          {ask === 'finish' && <div className="timebox"><span className="muted small">Tempo em atividade (calculado automaticamente)</span><big>{fmtDur(w)}</big><span className="muted small">Pausado: {fmtDur(p)} (a pausa não conta)</span></div>}
          {ask !== 'start' && <NoteForm nt={nt} setNt={setNt} nb={nb} setNb={setNb} subj={subj} setSubj={setSubj} titlePh="Sobre o que foi esta atividade?" />}
          <div className="row"><button className="primary" onClick={yes}>{ask === 'note' ? 'Salvar' : 'Sim'}</button><button className="ghost" onClick={() => setAsk(null)}>{ask === 'note' ? 'Cancelar' : 'Não'}</button></div>
        </div></div>}
    </li>
  )
}
