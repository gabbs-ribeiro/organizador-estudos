import { useRef } from 'react'

// Comentário estilo código: de "//" até o fim da linha (ignora "http://").
export const commentIdx = (line) => { let i = -1; while ((i = line.indexOf('//', i + 1)) !== -1) if (i === 0 || line[i - 1] !== ':') return i; return -1 }

export function Highlighted({ text }) {
  return text.split('\n').map((ln, k, a) => {
    const i = commentIdx(ln)
    return <span key={k}>{i < 0 ? ln : <>{ln.slice(0, i)}<span className="cm">{ln.slice(i)}</span></>}{k < a.length - 1 ? '\n' : ''}</span>
  })
}

// Textarea com camada de destaque por trás: texto após // fica verde enquanto você digita.
export default function NoteArea({ value, onChange, rows = 5, placeholder }) {
  const bd = useRef(null)
  return (
    <div className="notearea">
      <div className="nbd" ref={bd} aria-hidden="true"><Highlighted text={value} />{'\n'}</div>
      <textarea rows={rows} value={value} placeholder={placeholder} spellCheck="false" onChange={onChange} onScroll={(e) => { bd.current.scrollTop = e.target.scrollTop }} />
    </div>
  )
}
