export const iso = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10) }
export const today = () => iso(new Date())
export const weekStart = (d = new Date()) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x } // domingo
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
export const STATUS = { pendente:'Pendente', em_andamento:'Em andamento', pausada:'Pausada', concluida:'Concluída', adiada:'Adiada', nao_realizada:'Não realizada' }
export const CATS = { java:'Java', logica:'Lógica', algoritmos:'Algoritmos', estruturas:'Estruturas de dados', sql:'SQL', spring:'Spring Boot', git:'Git', ingles:'Inglês', faculdade:'Faculdade' }
export const TASK_CATS = { ...CATS, descanso:'Descanso' }
export const PLAT = { leetcode:'LeetCode', beecrowd:'Beecrowd', faculdade:'Faculdade', projeto:'Projeto próprio', outro:'Outro' }
export const DIF = { facil:'Fácil', medio:'Médio', dificil:'Difícil' }
export const EXST = { tentando:'Ainda tentando', com_ajuda:'Resolvido com ajuda', sozinho:'Resolvido sozinho', revisar:'Revisar novamente' }
export const fmtMin = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
export const fmtDur = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, z = (n) => String(n).padStart(2, '0'); return h ? `${h}h ${z(m)}min ${z(x)}s` : m ? `${m}min ${z(x)}s` : `${x}s` }
export const rangeText = (start, mins) => { if (!start || !(mins > 0)) return ''; const [h, m] = start.split(':').map(Number), t = h * 60 + m, e = (t + mins) % 1440, f = (x) => `${Math.floor(x / 60)}h${String(x % 60).padStart(2, '0')}`; return `${f(t)}–${f(e)}` }
export const stripRange = (d) => (d || '').replace(/^\d{1,2}h\d{2}\s*[–-]\s*\d{1,2}h\d{2}\s*(·\s*)?/, '')
export const DIA_FULL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
