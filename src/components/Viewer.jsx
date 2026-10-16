import { useEffect } from 'react'
import { Highlighted } from './NoteArea'

// Leitor: anotação em tela cheia (celular) / folha grande (PC) para estudar o conteúdo.
export default function Viewer({ v, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose}>
      <article className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><span className="pill">{v.kind} · {v.date}</span><div className="row">{v.actions}<button className="ghost" onClick={onClose}>Fechar</button></div></div>
        <h2>{v.title}</h2>
        {v.sub && <p className="muted">{v.sub}</p>}
        <div className="body">{v.body ? <Highlighted text={v.body} /> : <span className="muted">Sem descrição registrada.</span>}</div>
        {v.meta && <p className="muted small">{v.meta}</p>}
      </article>
    </div>
  )
}
