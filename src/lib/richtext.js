import { commentIdx } from '../components/NoteArea'

const OK = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'DIV', 'P', 'BR'])
const FONT_PX = { 1: 10, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 48 }
const okColor = (c) => /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\))$/i.test(c)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const plainToHtml = (t) => (t || '').split('\n').map((l) => `<div>${l ? esc(l) : '<br>'}</div>`).join('')

// Só passa o que o editor produz: negrito/itálico/sublinhado, tamanho em px, cor e o destaque de comentário (.cm).
export function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html')
  const walk = (src, dst) => src.childNodes.forEach((n) => {
    if (n.nodeType === 3) { dst.append(document.createTextNode(n.data)); return }
    if (n.nodeType !== 1) return
    const tag = n.tagName
    if (!OK.has(tag) && tag !== 'FONT') { if (!['SCRIPT', 'STYLE'].includes(tag)) walk(n, dst); return }
    const el = document.createElement(tag === 'FONT' ? 'span' : tag.toLowerCase()), st = n.style
    if (n.classList.contains('cm')) el.className = 'cm'
    if (tag === 'FONT') {
      const c = n.getAttribute('color'); if (c && okColor(c)) el.style.color = c
      const z = FONT_PX[n.getAttribute('size')]; if (z) el.style.fontSize = z + 'px'
    }
    if (/^\d{1,3}(\.\d+)?px$/.test(st.fontSize)) el.style.fontSize = st.fontSize
    if (st.color && okColor(st.color)) el.style.color = st.color
    if (/^(bold|[5-9]00)$/.test(st.fontWeight)) el.style.fontWeight = 'bold'
    if (st.fontStyle === 'italic') el.style.fontStyle = 'italic'
    if (/underline/.test(st.textDecorationLine || st.textDecoration || '')) el.style.textDecoration = 'underline'
    walk(n, el); dst.append(el)
  })
  const out = document.createElement('div'); walk(doc.body, out); return out.innerHTML
}

// Pinta de verde tudo que vem depois de "//" (até o fim do trecho de texto), sem mexer nas outras formatações.
export function decorate(root) {
  root.querySelectorAll('span.cm').forEach((sp) => sp.replaceWith(...sp.childNodes))
  root.normalize()
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = []
  while (w.nextNode()) nodes.push(w.currentNode)
  nodes.forEach((n) => {
    const i = commentIdx(n.data); if (i < 0) return
    const rest = n.splitText(i), sp = document.createElement('span')
    sp.className = 'cm'; rest.replaceWith(sp); sp.appendChild(rest)
  })
}

export function caretOffset(root) {
  const s = getSelection()
  if (!s.rangeCount || !root.contains(s.anchorNode)) return null
  const r = document.createRange(); r.selectNodeContents(root); r.setEnd(s.anchorNode, s.anchorOffset)
  return r.toString().length
}
export function setCaret(root, off) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, left = off
  while ((n = w.nextNode())) {
    if (left <= n.length) { const r = document.createRange(); r.setStart(n, left); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return }
    left -= n.length
  }
}
